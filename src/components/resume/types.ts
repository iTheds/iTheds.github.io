export interface MetricItem {
  label: string;
  value: string;
}

export interface HighlightItem {
  title: string;
  description: string;
}

export interface ContactItem {
  label: string;
  value: string;
}

export interface ResumeSkills {
  tags?: string[];
  highlights?: HighlightItem[];
  metrics?: MetricItem[];
  items?: string[];
}

export interface ResumeProfile {
  name: string;
  role: string;
  summary: string;
  phone: string;
  email: string;
  location: string;
  photoSrc?: string;
  status?: string;
  intent: string;
}

export interface ResumeWork {
  company: string;
  role: string;
  duration: string;
  timeline: string[];
}

export interface ResumeEducation {
  school: string;
  major: string;
  degree: string;
  duration: string;
  gpa?: string;
  items?: string[];
}

export interface ProjectItem {
  title: string;
  time: string;
  items: string[];
}
