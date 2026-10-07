const PROJECTS='yourkly_native_projects'
const FILES='yourkly_native_files'
const VERSIONS='yourkly_native_versions'

function read(key, fallback=[]) { try { return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback)) } catch { return fallback } }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); return value }

export function nativeProjects(){ return read(PROJECTS) }
export function nativeProject(id){ return nativeProjects().find(p=>p.id===id)||null }
export function createNativeProject(data){
  const project={id:crypto.randomUUID(),name:data.name.trim(),slug:data.slug,description:data.description?.trim()||'',provider:'yourkly',visibility:data.visibility||'private',projectType:data.projectType||'other',addAbout:data.addAbout!==false,ignoreTechnicalFiles:data.ignoreTechnicalFiles!==false,usage:data.usage||'private',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}
  write(PROJECTS,[...nativeProjects(),project]); return project
}
export function nativeFiles(projectId){ return read(FILES).filter(f=>f.projectId===projectId) }
export function nativeFile(projectId,fileId){ return read(FILES).find(f=>f.projectId===projectId&&f.id===fileId)||null }
export function saveNativeFile(projectId,file){
  const all=read(FILES), now=new Date().toISOString(); let saved
  const idx=all.findIndex(f=>f.projectId===projectId&&f.id===file.id)
  if(idx>=0){ saved={...all[idx],...file,updatedAt:now}; all[idx]=saved }
  else { saved={...file,id:file.id||crypto.randomUUID(),projectId,createdAt:now,updatedAt:now}; all.push(saved) }
  write(FILES,all); return saved
}
export function deleteNativeFile(projectId,fileId){ write(FILES,read(FILES).filter(f=>!(f.projectId===projectId&&f.id===fileId))) }
export function nativeVersions(projectId){ return read(VERSIONS).filter(v=>v.projectId===projectId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)) }
export function createNativeVersion(projectId,label='Save Point'){
  const version={id:crypto.randomUUID(),projectId,label,createdAt:new Date().toISOString(),files:nativeFiles(projectId).map(f=>({id:f.id,name:f.name,content:f.content||''}))}
  write(VERSIONS,[...read(VERSIONS),version]); return version
}
export function restoreNativeVersion(projectId,versionId){
  const version=read(VERSIONS).find(v=>v.projectId===projectId&&v.id===versionId); if(!version)return false
  const others=read(FILES).filter(f=>f.projectId!==projectId); const now=new Date().toISOString()
  write(FILES,[...others,...version.files.map(f=>({...f,projectId,updatedAt:now}))]); return true
}
export function deleteNativeProject(projectId){
  write(PROJECTS,nativeProjects().filter(p=>p.id!==projectId)); write(FILES,read(FILES).filter(f=>f.projectId!==projectId)); write(VERSIONS,read(VERSIONS).filter(v=>v.projectId!==projectId))
}
export function exportNativeProject(projectId){
  const p=nativeProject(projectId); if(!p)return null
  return {format:'yourkly-project-v1',exportedAt:new Date().toISOString(),project:p,files:nativeFiles(projectId),versions:nativeVersions(projectId)}
}
// Import a yourkly-project-v1 file (produced by Export project, or by an AI
// builder that was given the format). Everything gets fresh ids so an import
// can never collide with — or overwrite — what's already on this device.
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
  const files=(Array.isArray(data.files)?data.files:[]).map(f=>({
    id:crypto.randomUUID(),projectId,name:String(f&&f.name||'untitled').slice(0,200),
    content:typeof f.content==='string'?f.content:'',createdAt:(f&&f.createdAt)||now,updatedAt:now
  }))
  const versions=(Array.isArray(data.versions)?data.versions:[]).map(v=>({
    id:crypto.randomUUID(),projectId,label:String((v&&v.label)||'Save Point').slice(0,200),
    createdAt:(v&&v.createdAt)||now,
    files:(v&&Array.isArray(v.files)?v.files:[]).map(sf=>({
      id:crypto.randomUUID(),name:String(sf&&sf.name||'untitled').slice(0,200),
      content:typeof sf.content==='string'?sf.content:''
    }))
  }))
  write(PROJECTS,[...nativeProjects(),project])
  write(FILES,[...read(FILES),...files])
  write(VERSIONS,[...read(VERSIONS),...versions])
  return project
}
