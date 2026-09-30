import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNativeProject,saveNativeFile } from '../utils/nativeProjectStore'
import { PROJECT_TYPES,aboutContent,starterFiles,mitLicense } from '../utils/projectConfiguration'

function slugify(value){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)}

export default function NativeNewProject(){
 const navigate=useNavigate()
 const [step,setStep]=useState(1),[name,setName]=useState(''),[description,setDescription]=useState('')
 const [projectType,setProjectType]=useState('other'),[visibility,setVisibility]=useState('private')
 const [addAbout,setAddAbout]=useState(true),[ignoreTechnicalFiles,setIgnore]=useState(true),[usage,setUsage]=useState('private')
 function create(){
  const project=createNativeProject({name,slug:slugify(name),description,projectType,visibility,addAbout,ignoreTechnicalFiles,usage})
  if(addAbout)saveNativeFile(project.id,{name:'About this project.md',content:aboutContent(name,description,projectType)})
  if(usage==='mit')saveNativeFile(project.id,{name:'Usage rules.txt',content:mitLicense('Project owner')})
  starterFiles(projectType).forEach(f=>saveNativeFile(project.id,{name:f.path,content:f.content}))
  navigate(`/native/p/${project.id}`)
 }
 return <main className="onboarding-shell">
  <div className="onboarding-progress"><span>NEW PROJECT · {step} OF 2</span><i><b className={step===2?'onboarding-progress--two':''}/></i></div>
  {step===1?<><h1>Make your project</h1><p className="onboarding-lead">A project is simply the thing you're building. Give it a name you recognize and tell Yourkly, in your own words, what it is.</p><div className="translation-note"><strong>No technical description needed.</strong><span>“A website for my homeschool group” is enough. Yourkly uses this description to keep the rest of the workspace understandable.</span></div>
   <div className="newproject-form"><div><label className="newproject-label">What should it be called?</label><input className="newproject-input" value={name} onChange={e=>setName(e.target.value)} required autoFocus/></div><div><label className="newproject-label">What are you building?</label><input className="newproject-input" value={description} onChange={e=>setDescription(e.target.value)} placeholder="One sentence is enough"/></div><button className="landing-cta" disabled={!name.trim()} onClick={()=>setStep(2)}>Continue</button></div>
  </>:<><button className="back-link" onClick={()=>setStep(1)}>← Back</button><h1>Set it up</h1><p className="onboarding-lead">These choices tell Yourkly how to organize and protect your project. You can keep the defaults if you're unsure.</p><div className="translation-note"><strong>What happens when you click Create project?</strong><span>Yourkly creates a workspace for your files, adds a simple About page if you want one, and gives you a place to make Save Points as the project changes. Nothing here requires GitHub.</span></div>
   <div className="newproject-card config-card"><div><div className="newproject-label">What kind of project is this?</div><div className="newproject-hint">This helps Yourkly choose a useful starting structure. It does not lock you into a project type.</div><div className="config-grid">{PROJECT_TYPES.map(t=><button key={t.id} type="button" aria-pressed={projectType===t.id} className={`ai-tool${projectType===t.id?' ai-tool--on':''}`} onClick={()=>setProjectType(t.id)}><strong>{t.label}</strong><small>{t.description}</small></button>)}</div></div>
   <div><div className="newproject-label">Who can see this project?</div><div className="newproject-hint">Choose who this project is intended for. For this browser-based version, the project still stays on this device unless you export it.</div><div className="newproject-choices"><button type="button" aria-pressed={visibility==='private'} className={`ai-tool${visibility==='private'?' ai-tool--on':''}`} onClick={()=>setVisibility('private')}>Only me / people I invite</button><button type="button" aria-pressed={visibility==='public'} className={`ai-tool${visibility==='public'?' ai-tool--on':''}`} onClick={()=>setVisibility('public')}>Anyone</button></div></div>
   <label className="config-toggle"><span><strong>Add an About this project page</strong><small>A simple page explaining what this project is.</small></span><input type="checkbox" checked={addAbout} onChange={e=>setAddAbout(e.target.checked)}/></label>
   <label className="config-toggle"><span><strong>Ignore technical clutter</strong><small>Yourkly keeps temporary, secret, and generated files out of version history when applicable.</small></span><input type="checkbox" checked={ignoreTechnicalFiles} onChange={e=>setIgnore(e.target.checked)}/></label>
   <div><div className="newproject-label">How can other people use this project?</div><div className="newproject-hint">This is about reuse permission, not who can view the project. If you're unsure, leave it at “Don't give reuse permission.”</div><select className="newproject-input" value={usage} onChange={e=>setUsage(e.target.value)}><option value="private">Don't give reuse permission</option><option value="mit">Allow reuse with credit (MIT)</option></select></div>
   <button className="landing-cta" onClick={create}>Create project</button></div></>}
 </main>
}
