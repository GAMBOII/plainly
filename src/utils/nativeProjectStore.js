const PROJECTS='yourkly_native_projects'
const FILES='yourkly_native_files'
const VERSIONS='yourkly_native_versions'
const BLOBS='yourkly_native_blobs'
const ENGINE_FLAG='yourkly_snapshot_engine_v1'
const VERSIONS_BACKUP='yourkly_native_versions_backup'

function read(key, fallback=[]) { try { return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback)) } catch { return fallback } }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); return value }

const _te = new TextEncoder(), _td = new TextDecoder()
function strToBytes(s){ return _te.encode(s||'') }
function bytesToStr(b){ return _td.decode(b) }
function bytesToB64(bytes){ let s=''; for(let i=0;i<bytes.length;i+=0x8000){ s+=String.fromCharCode.apply(null, bytes.subarray(i,i+0x8000)) } return btoa(s) }
function b64ToBytes(b64){ const s=atob(b64), b=new Uint8Array(s.length); for(let i=0;i<s.length;i++) b[i]=s.charCodeAt(i); return b }

// SHA-256 over a Uint8Array, returned as hex. Pure JS, no dependencies.
function sha256Hex(bytes){
  const K=[
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]
  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19
  const bitLen=bytes.length*8, padded=(((bytes.length+8)>>6)+1)*64
  const m=new Uint8Array(padded); m.set(bytes); m[bytes.length]=0x80
  const dv=new DataView(m.buffer)
  dv.setUint32(padded-8, Math.floor(bitLen/4294967296)); dv.setUint32(padded-4, bitLen>>>0)
  const w=new Uint32Array(64), rotr=(x,n)=>(x>>>n)|(x<<(32-n))
  for(let off=0;off<padded;off+=64){
    for(let i=0;i<16;i++) w[i]=dv.getUint32(off+i*4)
    for(let i=16;i<64;i++){
      const s0=rotr(w[i-15],7)^rotr(w[i-15],18)^(w[i-15]>>>3)
      const s1=rotr(w[i-2],17)^rotr(w[i-2],19)^(w[i-2]>>>10)
      w[i]=(w[i-16]+s0+w[i-7]+s1)|0
    }
    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7
    for(let i=0;i<64;i++){
      const S1=rotr(e,6)^rotr(e,11)^rotr(e,25), ch=(e&f)^(~e&g), t1=(h+S1+ch+K[i]+w[i])|0
      const S0=rotr(a,2)^rotr(a,13)^rotr(a,22), maj=(a&b)^(a&c)^(b&c), t2=(S0+maj)|0
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0
    }
    h0=(h0+a)|0; h1=(h1+b)|0; h2=(h2+c)|0; h3=(h3+d)|0; h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0
  }
  return [h0,h1,h2,h3,h4,h5,h6,h7].map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')
}

// A blob is a file's bytes stored once, addressed by its SHA-256.
function writeBlob(bytes){
  const id=sha256Hex(bytes), all=read(BLOBS,{})
  if(!all[id]){ all[id]=bytesToB64(bytes); write(BLOBS,all) }
  return id
}
function readBlob(id){
  const b64=read(BLOBS,{})[id]
  if(typeof b64!=='string') throw new Error('missing_blob')
  return b64ToBytes(b64)
}

// Canonical snapshot bytes. Sorted keys make the id deterministic:
// the same content always produces the same id.
function canonicalSnapshot(parent,label,createdAt,files){
  const sorted={}
  Object.keys(files).sort().forEach(k=>{ sorted[k]={name:files[k].name,blob:files[k].blob} })
  return JSON.stringify({parent:parent,label:label,createdAt:createdAt,files:sorted})
}
function snapshotId(parent,label,createdAt,files){
  return sha256Hex(strToBytes(canonicalSnapshot(parent,label,createdAt,files)))
}
function isSnapshot(v){
  return v && typeof v==='object' && v.files && !Array.isArray(v.files) && typeof v.files==='object'
}
function validateSnapshot(snap){
  if(!isSnapshot(snap) || typeof snap.id!=='string' || typeof snap.label!=='string' || typeof snap.createdAt!=='string')
    throw new Error('bad_snapshot')
  if(snap.id!==snapshotId(snap.parent||null,snap.label,snap.createdAt,snap.files))
    throw new Error('corrupt_snapshot')
  return true
}
function findSnapshot(projectId,versionId){
  return read(VERSIONS,[]).find(v=>v.projectId===projectId&&v.id===versionId)||null
}
function headSnapshot(projectId){
  const list=read(VERSIONS,[]).filter(v=>v.projectId===projectId&&isSnapshot(v))
  if(!list.length) return null
  const byId={}; list.forEach(v=>{byId[v.id]=v})
  const isParent=new Set(list.map(v=>v.parent).filter(Boolean))
  const head=list.find(v=>!isParent.has(v.id))
  if(head) return head
  return list.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0]
}
function filesEqual(a,b){
  const ka=Object.keys(a).sort(), kb=Object.keys(b).sort()
  if(ka.length!==kb.length) return false
  return ka.every((k,i)=>k===kb[i]&&a[k].blob===b[k].blob&&a[k].name===b[k].name)
}

// One-time migration: old full-copy Save Points become chained snapshots.
// Old records are kept under a backup key. Never deletes user data on failure.
function migrateIfNeeded(){
  try{
    if(localStorage.getItem(ENGINE_FLAG)) return
    const old=read(VERSIONS,[])
    const legacy=old.filter(v=>v&&Array.isArray(v.files))
    if(legacy.length){
      try{ write(VERSIONS_BACKUP, old) }catch(e){}
      const byProject={}
      legacy.forEach(v=>{ (byProject[v.projectId]=byProject[v.projectId]||[]).push(v) })
      const snapshots=old.filter(v=>!(v&&Array.isArray(v.files)))
      Object.keys(byProject).forEach(pid=>{
        const list=byProject[pid].slice().sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')))
        let parent=null
        list.forEach(v=>{
          const files={}
          v.files.forEach(f=>{
            const fid=f&&f.id?String(f.id):('migrated-'+Math.random().toString(36).slice(2))
            files[fid]={name:String((f&&f.name)||'untitled').slice(0,200),blob:writeBlob(strToBytes(f&&f.content))}
          })
          const createdAt=v.createdAt||new Date().toISOString()
          const label=String(v.label||'Save Point').slice(0,200)
          const id=snapshotId(parent,label,createdAt,files)
          snapshots.push({id:id,parent:parent,projectId:pid,label:label,createdAt:createdAt,files:files,migrated:true})
          parent=id
        })
      })
      write(VERSIONS,snapshots)
    }
    // Current files: move content into blobs, keep a blob reference.
    const files=read(FILES,[])
    let changed=false
    const out=files.map(f=>{
      if(f&&f.blob) return f
      changed=true
      const blob=writeBlob(strToBytes(f&&f.content))
      const nf=Object.assign({},f,{blob:blob}); delete nf.content
      return nf
    })
    if(changed) write(FILES,out)
    localStorage.setItem(ENGINE_FLAG,'1')
  }catch(e){ /* storage may be blocked; the app keeps working in old mode */ }
}
try{ migrateIfNeeded() }catch(e){}

function rawFiles(projectId){ return read(FILES,[]).filter(f=>f&&f.projectId===projectId) }
function withContent(f){
  let content=''
  try{ if(f.blob) content=bytesToStr(readBlob(f.blob)) }catch(e){}
  return Object.assign({},f,{content:content})
}

export function nativeProjects(){ return read(PROJECTS) }
export function nativeProject(id){ return nativeProjects().find(p=>p.id===id)||null }
export function createNativeProject(data){
  const project={id:crypto.randomUUID(),name:data.name.trim(),slug:data.slug,description:data.description?.trim()||'',provider:'yourkly',visibility:data.visibility||'private',projectType:data.projectType||'other',addAbout:data.addAbout!==false,ignoreTechnicalFiles:data.ignoreTechnicalFiles!==false,usage:data.usage||'private',createdAt:data.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()}
  write(PROJECTS,[...nativeProjects(),project]); return project
}
export function nativeFiles(projectId){ return rawFiles(projectId).map(withContent) }
export function nativeFile(projectId,fileId){ const f=rawFiles(projectId).find(f=>f.id===fileId); return f?withContent(f):null }
export function saveNativeFile(projectId,file){
  const all=read(FILES,[]), now=new Date().toISOString(); let saved
  const blob=writeBlob(strToBytes(file.content))
  const idx=all.findIndex(f=>f.projectId===projectId&&f.id===file.id)
  if(idx>=0){ saved=Object.assign({},all[idx],{name:file.name,blob:blob,updatedAt:now}); delete saved.content; all[idx]=saved }
  else { saved={id:file.id||crypto.randomUUID(),projectId:projectId,name:file.name,blob:blob,createdAt:now,updatedAt:now}; all.push(saved) }
  write(FILES,all); return withContent(saved)
}
export function deleteNativeFile(projectId,fileId){ write(FILES,read(FILES,[]).filter(f=>!(f.projectId===projectId&&f.id===fileId))) }
export function nativeVersions(projectId){ return read(VERSIONS,[]).filter(v=>v.projectId===projectId&&isSnapshot(v)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))) }

// Makes a Save Point. Returns the snapshot, or null when nothing changed
// since the last Save Point (so the UI can say so instead of duplicating).
export function createNativeVersion(projectId,label='Save Point'){
  const files={}
  rawFiles(projectId).forEach(f=>{ files[f.id]={name:f.name,blob:f.blob} })
  if(!Object.keys(files).length) return null
  const head=headSnapshot(projectId)
  if(head&&filesEqual(head.files,files)) return null
  const createdAt=new Date().toISOString()
  const cleanLabel=String(label||'Save Point').slice(0,200)
  const parent=head?head.id:null
  const id=snapshotId(parent,cleanLabel,createdAt,files)
  const snap={id:id,parent:parent,projectId:projectId,label:cleanLabel,createdAt:createdAt,files:files}
  write(VERSIONS,[...read(VERSIONS,[]),snap]); return snap
}
// Restores a Save Point. First saves the current files as a new Save Point,
// so going back never loses newer work. Returns false when the Save Point
// is missing or damaged.
export function restoreNativeVersion(projectId,versionId){
  let snap=null
  try{ snap=findSnapshot(projectId,versionId); if(snap) validateSnapshot(snap) }catch(e){ return false }
  if(!snap) return false
  createNativeVersion(projectId,'Before going back')
  const others=read(FILES,[]).filter(f=>f.projectId!==projectId); const now=new Date().toISOString()
  const restored=Object.keys(snap.files).map(fid=>({id:fid,projectId:projectId,name:snap.files[fid].name,blob:snap.files[fid].blob,createdAt:now,updatedAt:now}))
  write(FILES,[...others,...restored]); return true
}
// Plain-words diff of one Save Point against the one before it.
export function snapshotDiff(projectId,versionId){
  const snap=findSnapshot(projectId,versionId); if(!snap||!isSnapshot(snap)) return null
  let parentFiles={}
  try{
    if(snap.parent){ const p=findSnapshot(projectId,snap.parent); if(p){ validateSnapshot(p); parentFiles=p.files } }
  }catch(e){ return null }
  const added=[],changed=[],removed=[]
  Object.keys(snap.files).forEach(fid=>{
    if(!parentFiles[fid]) added.push(snap.files[fid].name)
    else if(parentFiles[fid].blob!==snap.files[fid].blob||parentFiles[fid].name!==snap.files[fid].name) changed.push(snap.files[fid].name)
  })
  Object.keys(parentFiles).forEach(fid=>{ if(!snap.files[fid]) removed.push(parentFiles[fid].name) })
  return {added:added.sort(),changed:changed.sort(),removed:removed.sort()}
}
function collectBlobIds(){
  const ids=new Set()
  read(FILES,[]).forEach(f=>{ if(f&&f.blob) ids.add(f.blob) })
  read(VERSIONS,[]).forEach(v=>{ if(isSnapshot(v)) Object.keys(v.files).forEach(fid=>{ const e=v.files[fid]; if(e&&e.blob) ids.add(e.blob) }) })
  return ids
}
export function deleteNativeProject(projectId){
  write(PROJECTS,nativeProjects().filter(p=>p.id!==projectId)); write(FILES,read(FILES,[]).filter(f=>f.projectId!==projectId)); write(VERSIONS,read(VERSIONS,[]).filter(v=>v.projectId!==projectId))
  const keep=collectBlobIds(), all=read(BLOBS,{}), pruned={}
  Object.keys(all).forEach(k=>{ if(keep.has(k)) pruned[k]=all[k] })
  write(BLOBS,pruned)
}
export function exportNativeProject(projectId){
  const p=nativeProject(projectId); if(!p)return null
  const versions=nativeVersions(projectId)
  const allBlobs=read(BLOBS,{}), blobs={}
  const keepBlob=bid=>{ if(allBlobs[bid]) blobs[bid]=allBlobs[bid] }
  versions.forEach(v=>Object.keys(v.files).forEach(fid=>keepBlob(v.files[fid].blob)))
  rawFiles(projectId).forEach(f=>keepBlob(f.blob))
  return {format:'yourkly-project-v1',exportedAt:new Date().toISOString(),project:p,files:nativeFiles(projectId),versions:versions,blobs:blobs}
}
// Import a yourkly-project-v1 file (produced by Export project, or by an AI
// builder that was given the format). Everything gets fresh ids so an import
// can never collide with or overwrite what is already on this device.
// Handles both the legacy full-copy versions and the new snapshot versions.
export function importNativeProject(data){
  if(!data||data.format!=='yourkly-project-v1'||!data.project||typeof data.project.name!=='string')
    throw new Error('not_a_yourkly_file')
  const now=new Date().toISOString()
  const projectId=crypto.randomUUID()
  const taken=new Set(nativeProjects().map(p=>(p.name||'').trim().toLowerCase()))
  const base=(data.project.name||'').trim()||'Imported project'
  let name=base, n=0
  while(taken.has(name.toLowerCase())){ n++; name=`${base} (imported${n>1?' '+n:''})` }
  const src=data.project
  const project={
    id:projectId,name,slug:src.slug||('imported-'+projectId.slice(0,8)),
    description:(src.description||'').trim(),provider:'yourkly',
    visibility:src.visibility||'private',projectType:src.projectType||'other',
    addAbout:src.addAbout!==false,ignoreTechnicalFiles:src.ignoreTechnicalFiles!==false,
    usage:src.usage||'private',createdAt:src.createdAt||now,updatedAt:now
  }
  const incomingBlobs=(data&&typeof data.blobs==='object'&&data.blobs)||{}
  const allBlobs=read(BLOBS,{})
  let blobChanged=false
  Object.keys(incomingBlobs).forEach(bid=>{
    if(typeof incomingBlobs[bid]==='string'&&!allBlobs[bid]){ allBlobs[bid]=incomingBlobs[bid]; blobChanged=true }
  })
  if(blobChanged) write(BLOBS,allBlobs)
  const files=(Array.isArray(data.files)?data.files:[]).map(f=>{
    const blob=writeBlob(strToBytes(typeof f.content==='string'?f.content:''))
    return {
      id:crypto.randomUUID(),projectId,name:String(f&&f.name||'untitled').slice(0,200),
      blob:blob,createdAt:(f&&f.createdAt)||now,updatedAt:now
    }
  })
  // Normalize every incoming version to a snapshot, chained oldest-first.
  const incoming=(Array.isArray(data.versions)?data.versions:[]).slice()
    .sort((a,b)=>String((a&&a.createdAt)||'').localeCompare(String((b&&b.createdAt)||'')))
  const built=[]
  incoming.forEach(v=>{
    const filesMap={}
    if(v&&v.files&&!Array.isArray(v.files)){
      Object.keys(v.files).forEach(fid=>{
        const e=v.files[fid]||{}
        let blob=String(e.blob||'')
        if(!allBlobs[blob]){ blob=writeBlob(strToBytes('')); }
        filesMap[crypto.randomUUID()]={name:String(e.name||'untitled').slice(0,200),blob:blob}
      })
    }else{
      (v&&Array.isArray(v.files)?v.files:[]).forEach(sf=>{
        const content=typeof sf.content==='string'?sf.content:''
        filesMap[crypto.randomUUID()]={name:String(sf&&sf.name||'untitled').slice(0,200),blob:writeBlob(strToBytes(content))}
      })
    }
    const label=String((v&&v.label)||'Save Point').slice(0,200)
    const createdAt=(v&&v.createdAt)||now
    const parent=built.length?built[built.length-1].id:null
    const id=snapshotId(parent,label,createdAt,filesMap)
    built.push({id:id,parent:parent,projectId:projectId,label:label,createdAt:createdAt,files:filesMap,imported:true})
  })
  write(PROJECTS,[...nativeProjects(),project])
  write(FILES,[...read(FILES,[]),...files])
  write(VERSIONS,[...read(VERSIONS,[]),...built])
  return project
}
