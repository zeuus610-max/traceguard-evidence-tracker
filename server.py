"""FastAPI service for the TraceGuard digital evidence tracker prototype."""
from __future__ import annotations

import csv
import hashlib
import hmac
import io
import os
import secrets
import sqlite3
import threading
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("TRACEGUARD_DB", ROOT / "traceguard.sqlite3"))
PUBLIC_DEMO = os.environ.get("TRACEGUARD_PUBLIC_DEMO", "false").lower() in {"1", "true", "yes"}
DIST_PATH = ROOT / "dist"
PASSWORD_ROUNDS = 310_000
sessions: dict[str, int] = {}
session_lock = threading.Lock()
bearer = HTTPBearer(auto_error=False)


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def connect() -> sqlite3.Connection:
    db = sqlite3.connect(DB_PATH, timeout=15)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PASSWORD_ROUNDS)
    return f"pbkdf2_sha256${PASSWORD_ROUNDS}${salt.hex()}${digest.hex()}"


def password_matches(password: str, stored: str) -> bool:
    try:
        scheme, rounds, salt, expected = stored.split("$")
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(rounds)).hex()
        return scheme == "pbkdf2_sha256" and hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL CHECK(role IN ('admin','investigator','viewer')),
            password_hash TEXT NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY, case_ref TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
            lead TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'Open'
              CHECK(status IN ('Open','In review','Closed')),
            description TEXT NOT NULL DEFAULT '', opened_at TEXT NOT NULL,
            updated_at TEXT NOT NULL, created_by INTEGER REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS evidence (
            id INTEGER PRIMARY KEY, evidence_ref TEXT NOT NULL UNIQUE,
            case_id INTEGER NOT NULL REFERENCES cases(id), category TEXT NOT NULL,
            description TEXT NOT NULL, received_at TEXT NOT NULL, source TEXT NOT NULL DEFAULT '',
            location TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'Received'
              CHECK(status IN ('Received','In review','Sealed','Transferred','Released')),
            recorded_by TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL, created_by INTEGER REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS custody (
            id INTEGER PRIMARY KEY, evidence_id INTEGER NOT NULL REFERENCES evidence(id),
            action TEXT NOT NULL, from_location TEXT NOT NULL DEFAULT '',
            to_location TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
            user_id INTEGER REFERENCES users(id), user_name TEXT NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS activity (
            id INTEGER PRIMARY KEY, action TEXT NOT NULL, summary TEXT NOT NULL,
            user_id INTEGER REFERENCES users(id), user_name TEXT NOT NULL,
            user_email TEXT NOT NULL, case_id INTEGER REFERENCES cases(id),
            evidence_id INTEGER REFERENCES evidence(id), created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);
        CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC);
        """)
        if db.execute("SELECT 1 FROM users LIMIT 1").fetchone():
            return
        demo = ([
            ("TraceGuard Demo", "viewer@traceguard.local", "viewer"),
        ] if PUBLIC_DEMO else [
            ("Asha Raman", "admin@traceguard.local", "admin"),
            ("Dev Menon", "investigator@traceguard.local", "investigator"),
            ("Mira Shah", "viewer@traceguard.local", "viewer"),
        ])
        ids = {}
        for name, email, role in demo:
            cursor = db.execute("INSERT INTO users(name,email,role,password_hash,created_at) VALUES(?,?,?,?,?)", (name,email,role,password_hash("TraceGuard!2026"),now()))
            ids[role] = cursor.lastrowid
        admin_id = ids.get("admin", ids["viewer"])
        investigator_id = ids.get("investigator", ids["viewer"])
        case_creator = "TraceGuard Demo" if PUBLIC_DEMO else "Asha Raman"
        evidence_creator = "TraceGuard Demo" if PUBLIC_DEMO else "Dev Menon"
        samples = [
            ("DC-2026-014", "Unauthorized access review", "Dev Menon", "In review", "Review of reported access to an organization account."),
            ("DC-2026-009", "Lost device report", "Asha Raman", "Open", "Record the reported loss and related handling history."),
            ("DC-2026-003", "Records retention inquiry", "Dev Menon", "Closed", "Completed review of a records retention request."),
        ]
        cids=[]
        for ref,title,lead,state,description in samples:
            stamp=now()
            cursor=db.execute("INSERT INTO cases(case_ref,title,lead,status,description,opened_at,updated_at,created_by) VALUES(?,?,?,?,?,?,?,?)",(ref,title,lead,state,description,stamp,stamp,admin_id))
            cids.append(cursor.lastrowid)
        evidence_rows = [
            ("EV-2026-001",cids[0],"Account record","Service account access summary, reference copy.","2026-11-18","IT service desk","Vault ref 04-B","In review"),
            ("EV-2026-002",cids[0],"Email export","Requested mailbox export package; sealed reference.","2026-11-19","Records team","Secure cabinet A-2","Sealed"),
            ("EV-2026-003",cids[1],"Mobile device","Reported device, receipt and storage details.","2026-11-21","Case contact","Locker 02","Received"),
            ("EV-2026-004",cids[2],"Document","Retention schedule copy for the completed inquiry.","2026-11-07","Records team","Archive ref 7C","Released"),
        ]
        for ref,cid,category,description,received,source,location,state in evidence_rows:
            stamp=now()
            cursor=db.execute("INSERT INTO evidence(evidence_ref,case_id,category,description,received_at,source,location,status,recorded_by,created_at,updated_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(ref,cid,category,description,received,source,location,state,evidence_creator,stamp,stamp,investigator_id))
            eid=cursor.lastrowid
            db.execute("INSERT INTO custody(evidence_id,action,from_location,to_location,notes,user_id,user_name,created_at) VALUES(?,?,?,?,?,?,?,?)",(eid,"Evidence registered",source,location,"Initial receipt recorded.",investigator_id,evidence_creator,stamp))
            db.execute("INSERT INTO activity(action,summary,user_id,user_name,user_email,case_id,evidence_id,created_at) VALUES(?,?,?,?,?,?,?,?)",("evidence.created",f"Registered evidence {ref}",investigator_id,evidence_creator,"viewer@traceguard.local" if PUBLIC_DEMO else "investigator@traceguard.local",cid,eid,stamp))
        for cid,ref,title in [(cids[0],"DC-2026-014","Unauthorized access review"),(cids[1],"DC-2026-009","Lost device report"),(cids[2],"DC-2026-003","Records retention inquiry")]:
            db.execute("INSERT INTO activity(action,summary,user_id,user_name,user_email,case_id,created_at) VALUES(?,?,?,?,?,?,?)",("case.created",f"Created case {ref} · {title}",admin_id,case_creator,"viewer@traceguard.local" if PUBLIC_DEMO else "admin@traceguard.local",cid,now()))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="TraceGuard API", description="Metadata-only digital evidence tracker prototype", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173","http://127.0.0.1:5173"], allow_credentials=False, allow_methods=["GET","POST","PATCH","OPTIONS"], allow_headers=["Authorization","Content-Type"])


class LoginBody(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=254)
    password: str = Field(min_length=1, max_length=200)


class CaseBody(BaseModel):
    case_ref: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=120)
    lead: str = Field(default="", max_length=100)
    status: Literal['Open','In review','Closed'] = 'Open'
    description: str = Field(default="", max_length=1000)


class EvidenceBody(BaseModel):
    case_id: int
    evidence_ref: str | None = Field(default=None, max_length=40)
    category: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=500)
    received_at: str = Field(min_length=1, max_length=30)
    source: str = Field(default="", max_length=160)
    location: str = Field(default="", max_length=160)
    status: Literal['Received','In review','Sealed','Transferred','Released'] = 'Received'
    recorded_by: str = Field(default="", max_length=100)


class CustodyBody(BaseModel):
    action: Literal['Review','Handover','Transfer','Seal check','Storage update','Release','Status update']
    from_location: str = Field(default="", max_length=160)
    to_location: str = Field(default="", max_length=160)
    notes: str = Field(default="", max_length=300)
    status: Literal['Received','In review','Sealed','Transferred','Released'] | None = None


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    token = credentials.credentials if credentials else ""
    with session_lock:
        uid = sessions.get(token)
    if not uid:
        raise HTTPException(status_code=401, detail="Please sign in to continue")
    with connect() as db:
        user = db.execute("SELECT id,name,email,role FROM users WHERE id=?",(uid,)).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Session is no longer valid")
    return {**dict(user), "token": token}


def editor(user=Depends(current_user)):
    if user['role'] not in ('admin','investigator'):
        raise HTTPException(status_code=403, detail="Your account has read-only access")
    return user


def add_activity(db, action, summary, user, case_id=None, evidence_id=None):
    db.execute("INSERT INTO activity(action,summary,user_id,user_name,user_email,case_id,evidence_id,created_at) VALUES(?,?,?,?,?,?,?,?)", (action,summary,user['id'],user['name'],user['email'],case_id,evidence_id,now()))


@app.get("/api/health")
def health():
    return {"ok": True, "service": "TraceGuard API"}


@app.get("/api/public-config")
def public_config():
    return {"public_demo": PUBLIC_DEMO, "demo_email": "viewer@traceguard.local"}


@app.post("/api/auth/login")
def login(body: LoginBody):
    with connect() as db:
        row=db.execute("SELECT * FROM users WHERE email=?",(body.email.lower(),)).fetchone()
    if not row or not password_matches(body.password,row['password_hash']):
        raise HTTPException(status_code=401,detail="Email or password is incorrect")
    token=secrets.token_urlsafe(32)
    with session_lock:
        sessions[token]=row['id']
    return {"token":token,"user":{"id":row['id'],"name":row['name'],"email":row['email'],"role":row['role']}}


@app.get("/api/auth/me")
def me(user=Depends(current_user)):
    return {"user":{key:user[key] for key in ('id','name','email','role')}}


@app.post("/api/auth/logout")
def logout(user=Depends(current_user)):
    with session_lock:
        sessions.pop(user['token'],None)
    return {"ok":True}


@app.get("/api/cases")
def list_cases(_user=Depends(current_user)):
    with connect() as db:
        return [dict(row) for row in db.execute("SELECT * FROM cases ORDER BY opened_at DESC,id DESC").fetchall()]


@app.post("/api/cases",status_code=201)
def create_case(body: CaseBody,user=Depends(editor)):
    ref=body.case_ref.strip().upper(); title=body.title.strip()
    if not ref or not title: raise HTTPException(400,detail="Case reference and title are required")
    stamp=now()
    try:
        with connect() as db:
            cur=db.execute("INSERT INTO cases(case_ref,title,lead,status,description,opened_at,updated_at,created_by) VALUES(?,?,?,?,?,?,?,?)",(ref,title,body.lead.strip(),body.status,body.description.strip(),stamp,stamp,user['id']))
            add_activity(db,"case.created",f"Created case {ref} · {title}",user,case_id=cur.lastrowid)
            return dict(db.execute("SELECT * FROM cases WHERE id=?",(cur.lastrowid,)).fetchone())
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409,detail="That case reference is already in use")


@app.patch("/api/cases/{case_id}")
def update_case(case_id:int,body:CaseBody,user=Depends(editor)):
    ref=body.case_ref.strip().upper(); title=body.title.strip()
    try:
        with connect() as db:
            if not db.execute("SELECT 1 FROM cases WHERE id=?",(case_id,)).fetchone(): raise HTTPException(404,detail="Case not found")
            db.execute("UPDATE cases SET case_ref=?,title=?,lead=?,status=?,description=?,updated_at=? WHERE id=?",(ref,title,body.lead.strip(),body.status,body.description.strip(),now(),case_id))
            add_activity(db,"case.updated",f"Updated case {ref} · {title}",user,case_id=case_id)
            return dict(db.execute("SELECT * FROM cases WHERE id=?",(case_id,)).fetchone())
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409,detail="That case reference is already in use")


@app.get("/api/evidence")
def list_evidence(_user=Depends(current_user)):
    with connect() as db:
        return [dict(row) for row in db.execute("SELECT * FROM evidence ORDER BY received_at DESC,id DESC").fetchall()]


@app.post("/api/evidence",status_code=201)
def create_evidence(body:EvidenceBody,user=Depends(editor)):
    with connect() as db:
        if not db.execute("SELECT 1 FROM cases WHERE id=?",(body.case_id,)).fetchone(): raise HTTPException(404,detail="Case not found")
        ref=(body.evidence_ref or "").strip()
        if not ref:
            while True:
                ref='EV-'+datetime.now().strftime('%Y')+'-'+secrets.token_hex(3).upper()
                if not db.execute("SELECT 1 FROM evidence WHERE evidence_ref=?",(ref,)).fetchone(): break
        stamp=now()
        try:
            cur=db.execute("INSERT INTO evidence(evidence_ref,case_id,category,description,received_at,source,location,status,recorded_by,created_at,updated_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(ref,body.case_id,body.category.strip(),body.description.strip(),body.received_at.strip(),body.source.strip(),body.location.strip(),body.status,body.recorded_by.strip() or user['name'],stamp,stamp,user['id']))
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409,detail="That evidence ID is already in use")
        eid=cur.lastrowid
        db.execute("INSERT INTO custody(evidence_id,action,from_location,to_location,notes,user_id,user_name,created_at) VALUES(?,?,?,?,?,?,?,?)",(eid,"Evidence registered",body.source.strip(),body.location.strip(),"Initial receipt recorded.",user['id'],user['name'],stamp))
        add_activity(db,"evidence.created",f"Registered evidence {ref}",user,case_id=body.case_id,evidence_id=eid)
        add_activity(db,"custody.created",f"Recorded initial custody for {ref}",user,case_id=body.case_id,evidence_id=eid)
        return dict(db.execute("SELECT * FROM evidence WHERE id=?",(eid,)).fetchone())


@app.get("/api/evidence/{evidence_id}/custody")
def list_custody(evidence_id:int,_user=Depends(current_user)):
    with connect() as db:
        if not db.execute("SELECT 1 FROM evidence WHERE id=?",(evidence_id,)).fetchone(): raise HTTPException(404,detail="Evidence item not found")
        return [dict(row) for row in db.execute("SELECT * FROM custody WHERE evidence_id=? ORDER BY created_at DESC,id DESC",(evidence_id,)).fetchall()]


@app.post("/api/evidence/{evidence_id}/custody",status_code=201)
def add_custody(evidence_id:int,body:CustodyBody,user=Depends(editor)):
    if body.action=='Status update' and body.status is None:
        raise HTTPException(400,detail="Choose a status for this update")
    with connect() as db:
        item=db.execute("SELECT * FROM evidence WHERE id=?",(evidence_id,)).fetchone()
        if not item: raise HTTPException(404,detail="Evidence item not found")
        new_status=body.status or {'Transfer':'Transferred','Release':'Released','Seal check':'Sealed'}.get(body.action,item['status'])
        notes=body.notes.strip()
        if body.action=='Status update': notes=(notes+' · ' if notes else '')+f"Status changed to {new_status}"
        stamp=now()
        cur=db.execute("INSERT INTO custody(evidence_id,action,from_location,to_location,notes,user_id,user_name,created_at) VALUES(?,?,?,?,?,?,?,?)",(evidence_id,body.action,body.from_location.strip(),body.to_location.strip(),notes,user['id'],user['name'],stamp))
        db.execute("UPDATE evidence SET status=?,location=?,updated_at=? WHERE id=?",(new_status,body.to_location.strip() or item['location'],stamp,evidence_id))
        add_activity(db,"custody.created",f"Logged {body.action.lower()} for {item['evidence_ref']}",user,case_id=item['case_id'],evidence_id=evidence_id)
        return dict(db.execute("SELECT * FROM custody WHERE id=?",(cur.lastrowid,)).fetchone())


@app.get("/api/activity")
def activity(limit:int=100,_user=Depends(current_user)):
    limit=max(1,min(200,limit))
    with connect() as db:
        return [dict(row) for row in db.execute("SELECT * FROM activity ORDER BY created_at DESC,id DESC LIMIT ?",(limit,)).fetchall()]


@app.get("/api/reports/export.csv")
def report(_user=Depends(current_user)):
    output=io.StringIO(newline=''); writer=csv.writer(output)
    writer.writerow(["Case reference","Case title","Case status","Lead investigator","Evidence ID","Category","Description","Date received","Source","Status","Reference location","Recorded by","Custody action","From reference","To reference","Custody notes","Handled by","Custody timestamp"])
    with connect() as db:
        rows=db.execute("""SELECT c.case_ref,c.title,c.status,c.lead,e.evidence_ref,e.category,e.description,e.received_at,e.source,e.status,e.location,e.recorded_by,cu.action,cu.from_location,cu.to_location,cu.notes,cu.user_name,cu.created_at FROM cases c LEFT JOIN evidence e ON e.case_id=c.id LEFT JOIN custody cu ON cu.evidence_id=e.id ORDER BY c.opened_at DESC,e.id,cu.created_at""").fetchall()
    for row in rows: writer.writerow(list(row))
    return StreamingResponse(iter(["\ufeff"+output.getvalue()]),media_type="text/csv; charset=utf-8",headers={"Content-Disposition":"attachment; filename=traceguard-evidence-report.csv","Cache-Control":"no-store"})


if DIST_PATH.is_dir():
    assets_path = DIST_PATH / "assets"
    if assets_path.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/", include_in_schema=False)
    def frontend_root():
        return FileResponse(DIST_PATH / "index.html")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend_fallback(path: str):
        if path == "api" or path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = (DIST_PATH / path).resolve()
        if candidate.is_relative_to(DIST_PATH.resolve()) and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST_PATH / "index.html")
