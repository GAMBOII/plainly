import { Link } from 'react-router-dom'
import BrandWordmark from '../components/BrandWordmark'
import { nativeProjects } from '../utils/nativeProjectStore'

export default function NativeProjects() {
  const projects=nativeProjects()
  return <div className="welcome-page"><div className="landing-shell">
    <header className="landing-header"><BrandWordmark className="brand-wordmark--landing" /><Link className="pl-btn" to="/">Home</Link></header>
    <main className="screen-padded mobile-projects">
      <div className="projects-heading-row"><div><div className="eyebrow">YOURKLY PROJECTS</div><h1>Your Projects</h1><p className="muted">This is your workspace. Each project keeps its files, description, and Save Points together so you can always tell what you're working on and where you left off.</p><p className="muted">These live in this browser on this device, so there's no login — but they won't follow you to another device unless you export them.</p></div>{projects.length > 0 && <Link className="pl-btn-primary" to="/native/new">+ New project</Link>}</div>
      {projects.length===0?<div className="projects-empty native-empty-explainer"><div><div className="eyebrow">YOUR FIRST PROJECT</div><h2>Start with the thing you're building</h2><p>You don't need to set up GitHub or know developer language. Tell Yourkly what you're making, and we'll organize the files and versions around that project.</p></div><div className="translation-strip"><div><strong>Project</strong><span>The whole thing you're building.</span></div><div><strong>Files</strong><span>The pieces that make up your project.</span></div><div><strong>Save Point</strong><span>A version you can come back to later.</span></div></div><Link className="pl-btn-primary" to="/native/new">Create my first project</Link></div>:
      <div className="projects-grid">{projects.map(p=><Link className="project-card" key={p.id} to={`/native/p/${p.id}`}><div className="project-card-main"><strong>{p.name}</strong><p>{p.description||'Yourkly-managed project'}</p><span className="project-meta">Kept with Yourkly · GitHub not connected</span></div></Link>)}</div>}
    </main>
  </div></div>
}
