export const categories = ['AI & Automation','SaaS & Technology','Business Strategy','Go-To-Market','Sales & Revenue','D2C & Branding','Research & Analysis','Content & Creativity','Personal Experiments'];
export const projectTypes = ['Built','Researched','Strategy','Experiment','Case Study','Learning'];
export const statuses = ['Completed','In Progress','Planned','Published'];
export type RecordData = { id:string; [key:string]: any };
export type PortfolioData = { profile: RecordData; experiences: RecordData[]; projects: RecordData[]; skills: RecordData[]; tools: RecordData[]; journey: RecordData[]; categories: RecordData[] };
