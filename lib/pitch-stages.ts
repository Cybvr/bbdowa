export type PitchStage = {
  title: string;
  tasks: string[];
};

export const PITCH_STAGES: PitchStage[] = [
  {
    title: "Client Consultation",
    tasks: [
      "Confirm receipt of brief and agency participation",
      "Prepare and share key questions for clarification",
    ],
  },
  {
    title: "Prequalification Documentation",
    tasks: ["Update agency credentials and show reel"],
  },
  {
    title: "Team Setup",
    tasks: [
      "Assign pitch coordinator and assistant",
      "Assign strategy resource(s)",
      "Assign creative resource(s)",
      "Identify and appoint freelance resource(s)",
    ],
  },
  {
    title: "Pitch Budget",
    tasks: [
      "Prepare and secure approvals for welfare budget",
      "Prepare and secure approvals for production budget",
      "Prepare and secure approvals for freelancer budget",
    ],
  },
  {
    title: "Welfare & Logistics",
    tasks: [
      "Reserve meeting rooms for sessions and reviews",
      "Schedule key sessions and reviews",
    ],
  },
  {
    title: "Prep Work",
    tasks: [
      "Distill client brief and define specific tasks",
      "Develop creative brief",
      "Gather all relevant reference materials",
      "Consult MEA for previous experience within network",
      "Gather relevant resources on client and category",
    ],
  },
  {
    title: "Research & Testing",
    tasks: [
      "Acquire relevant omnibus research",
      "Organise consumer sessions to gain deeper insights",
      "Organise concept testing for agreed creative ideas",
    ],
  },
  {
    title: "Strategy",
    tasks: [
      "Interrogate consumers, category, culture and the company",
      "Identify the context and challenge",
      "Define our story in five lines (refer to playbook)",
      "Apply the MoveBeyondReason strategic tool",
      "Define strategic imperatives and identify specific initiatives",
      "Cascade overall strategy to digital, activation, media, etc.",
    ],
  },
  {
    title: "Ideation & Exploration",
    tasks: [
      "Develop and agree on an organising idea",
      "Explore multiple territories and develop rationales",
      "Agree on visual style and assets",
      "Review organising idea, territories and visual style",
    ],
  },
  {
    title: "Amplification & Leveraging",
    tasks: [
      "Broadcast executions — radio, TV and videos",
      "Print executions — KV and adaptations to OOH and POSM",
      "Digital executions — content, social media and online media",
      "Consumer engagement executions — online and offline",
      "Media management strategy and plan",
      "Reputation management strategy and plan",
      "The Outlier / Game Changer initiative",
      "Review amplification ideas, initiatives and executions",
    ],
  },
  {
    title: "Execution & Production",
    tasks: [
      "Broadcast — radio/jingle demos, moodboards and animatics",
      "Print — mockups and print samples",
      "Digital — animations and demos",
    ],
  },
  {
    title: "Final Document Preparation",
    tasks: [
      "Introducing DDB Lagos",
      "Recap of brief, context and challenge",
      "Shifts — consumer, category, culture and company",
      "Our story in five lines",
      "Organising idea, territories and rationale",
      "Amplification and execution",
      "Account management structure, remuneration and final recap",
    ],
  },
  {
    title: "Final Reviews & Rehearsals",
    tasks: ["Complete the final review", "Run the full presentation rehearsal"],
  },
  {
    title: "Client Presentation",
    tasks: ["Deliver the final client presentation"],
  },
  {
    title: "Follow Up",
    tasks: ["Send follow-up communication and agree next steps"],
  },
];
