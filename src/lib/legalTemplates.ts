export interface LegalTemplateField {
  id: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'date';
  defaultValue?: string;
}

export interface LegalTemplateConfig {
  id: string;
  name: string;
  description: string;
  fields: LegalTemplateField[];
  generateText: (fields: Record<string, string>, creatorName: string, clientName: string, currency?: string) => string;
}

export const LEGAL_TEMPLATES: Record<string, LegalTemplateConfig> = {
  nda: {
    id: 'nda',
    name: 'Non-Disclosure Agreement (NDA)',
    description: 'Protect confidential information, trade secrets, and proprietary concepts.',
    fields: [
      { id: 'purpose', label: 'Evaluation Purpose', placeholder: 'e.g. Software development and architecture review' },
      { id: 'duration', label: 'Confidentiality Duration', placeholder: 'e.g. 2 Years', defaultValue: '2 Years' },
      { id: 'jurisdiction', label: 'Governing Jurisdiction', placeholder: 'e.g. Sindh, Pakistan', defaultValue: 'Sindh, Pakistan' },
    ],
    generateText: (f, creator, client) => {
      return `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is executed on ${new Date().toLocaleDateString()}, by and between:
• Disclosing Party: ${creator}
• Receiving Party: ${client}

1. Purpose
The Parties desire to engage in confidential discussions and business evaluation regarding: ${f.purpose || 'Collaborative Business Ventures'}.

2. Definition of Confidential Information
"Confidential Information" refers to any proprietary, technical, operational, or commercial information disclosed by either party, whether in tangible, written, electronic, or verbal form.

3. Protection & Non-Disclosure Obligations
The Receiving Party agrees:
a) To hold the Confidential Information in strict confidence and protect it using at least reasonable care.
b) Not to copy, transmit, reverse-engineer, or disclose any part of the Confidential Information to unauthorized third parties without prior written consent.
c) To use the Confidential Information solely for the authorized purpose stated herein.

4. Duration & Governing Law
The obligations and covenants under this Agreement shall remain legally binding for a term of ${f.duration || '2 Years'} from execution. This Agreement shall be governed by and enforced according to the laws of ${f.jurisdiction || 'Sindh, Pakistan'}.`;
    },
  },

  employment: {
    id: 'employment',
    name: 'Employment Contract',
    description: 'Formal employment relationship, role duties, compensation, and workplace terms.',
    fields: [
      { id: 'jobTitle', label: 'Designated Role / Position', placeholder: 'e.g. Lead DevOps Engineer' },
      { id: 'startDate', label: 'Commencement Date', placeholder: '', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { id: 'compensation', label: 'Salary / Compensation Amount', placeholder: 'e.g. 250,000 / Month' },
      { id: 'noticePeriod', label: 'Notice Period', placeholder: 'e.g. 30 Days', defaultValue: '30 Days' },
    ],
    generateText: (f, creator, client, currency = 'USD') => {
      const formattedSalary = f.compensation ? `${currency} ${f.compensation}` : 'Agreed Rate';
      return `EMPLOYMENT AGREEMENT

This Employment Agreement is executed between ${creator} ("Employer") and ${client} ("Employee").

1. Position & Scope of Work
The Employer hereby employs the Employee in the capacity of ${f.jobTitle || 'Specialist'}, starting on ${f.startDate || new Date().toLocaleDateString()}.

2. Remuneration & Schedule
The Employee shall receive remuneration of ${formattedSalary}, payable according to the Employer's customary payroll calendar.

3. Termination Policy
Either party may terminate this employment agreement by tendering a written notice of ${f.noticePeriod || '30 Days'} to the other party.

4. Intellectual Property & Workplace Propriety
All work products, architectures, source codes, and documentation produced by the Employee during the course of employment remain the exclusive intellectual property of the Employer.`;
    },
  },

  service: {
    id: 'service',
    name: 'Service Agreement',
    description: 'Clear statement of ongoing or fixed professional advisory/service delivery.',
    fields: [
      { id: 'serviceDescription', label: 'Deliverable Scope', placeholder: 'e.g. Full-Stack Web Deployment & Cloud DevOps Orchestration' },
      { id: 'feeStructure', label: 'Service Retainer / Total Fee Amount', placeholder: 'e.g. 150,000' },
      { id: 'completionTarget', label: 'Target Completion Date', placeholder: '', type: 'date', defaultValue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    ],
    generateText: (f, creator, client, currency = 'USD') => {
      const formattedFee = f.feeStructure ? `${currency} ${f.feeStructure}` : 'Fixed Fee';
      return `PROFESSIONAL SERVICES AGREEMENT

This Agreement is entered into between ${creator} ("Service Provider") and ${client} ("Client").

1. Scope of Services
The Service Provider agrees to deliver the following services:
${f.serviceDescription || 'Professional services as described.'}

2. Commercial Terms
The consideration for the execution of the services outlined above is ${formattedFee}.

3. Performance Standard & Completion
The Service Provider warrants that all deliverables will adhere to industry engineering standards by target date ${f.completionTarget || 'As Mutually Agreed'}.`;
    },
  },
};