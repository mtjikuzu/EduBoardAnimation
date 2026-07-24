# EduWhiteboard

EduWhiteboard is a consumer SaaS for producing educational whiteboard videos from a conversational lesson brief. Its initial product boundary is hosted video creation and optional YouTube publishing; self-hosting and school organizations are later deployment and market modes.

## Language

**Hosted SaaS**:
The initial supported EduWhiteboard product: a managed, multi-tenant web service where rendering and AI generation run on platform-managed infrastructure.
_Avoid_: local-first product, offline MVP

**Self-hosted deployment**:
A future deployment mode in which an organization operates EduWhiteboard and its generation stack in its own environment.
_Avoid_: MVP offline mode

**Organization**:
A future school or other institutional workspace with its own branding, members, and shared resources; it is not part of the initial consumer product.
_Avoid_: tenant, school account

**Open-source application**:
The complete EduWhiteboard application and deployable infrastructure templates, released under MIT; it excludes only secrets, tenant data, and deployment-specific configuration.
_Avoid_: open core, source-available edition

**Creator**:
An individual consumer account that owns private lesson projects and authorizes publishing destinations.
_Avoid_: teacher account, tenant

**Launch creator**:
An English-speaking independent educational creator who makes 3–8 minute evergreen explanatory lessons for secondary-school audiences. Initial subject lanes are mathematics, science, accounting, and practical business concepts.
_Avoid_: learner, child account

**Lesson project**:
A creator-owned unit of work containing a lesson brief, its inspectable storyboard, generated media, and exports.
_Avoid_: video, document

**Render credit**:
A prepaid unit charged only for expensive media-generation work, such as a changed scene’s full render or a final export; cache reuse is not charged.
_Avoid_: chat token, edit fee

**Canonical export**:
The single approved full-quality lesson video produced as a 16:9 1080p MP4 under the platform’s fixed media contract; it is the artifact used for download and YouTube publishing.
_Avoid_: output variant, render preset

**Publishing destination**:
A creator-authorized external service that receives an approved lesson export. YouTube is the initial and only supported destination.
_Avoid_: social media integration, distribution channel

**Visual asset**:
A license-tracked, reusable SVG, procedural diagram, equation, table, chart, or basic shape used in a scene before whiteboard-style normalization.
_Avoid_: generated image, illustration file

**Final-render approval**:
The creator’s explicit confirmation of a validated storyboard and its estimated credit cost before paid high-resolution scene rendering begins.
_Avoid_: automatic full render

**Scene**:
One ordered, independently renderable unit of a storyboard, containing its narration, visual assets, animation timing, and render cache identity.
_Avoid_: slide, clip

**Storyboard**:
The editable structured representation of a lesson project’s ordered scenes, narration, visual elements, and timing intent.
_Avoid_: script, canvas
