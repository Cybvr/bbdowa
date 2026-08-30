export type Job = {
  slug: string;
  title: string;
  department: string;
  location: string;
  workMode: "Hybrid" | "On-site" | "Remote";
  status: "open" | "closed";
  summary?: string;
  description?: string;
  qualifications?: string[];
  responsibilities?: string[];
  about?: string[];
  schedule?: string;
  salary?: string;
};

export const JOBS: Job[] = [
  {
    slug: "strategy-lead",
    title: "Strategy Lead",
    department: "Strategy & Intelligence",
    location: "Victoria Island, Lagos",
    workMode: "Hybrid",
    status: "open",
    summary:
      "At BBDO West Africa, we believe great strategy is what separates an idea that gets noticed from one that gets remembered. We are looking for a Strategy Lead who can take a client's vague panic and turn it into a one-page plan that sounds obvious once it is written down.",
    description:
      "The Strategy Lead sits at the center of how we plan, brief, and defend our thinking, working closely with our creative teams and carrying real weight in the client relationships that matter most. You will lead and mentor a team of planners, help shape how the department approaches research and insight, and be someone people trust to speak for strategy in the room when it counts.",
    qualifications: [
      "8 to 10 years of experience in brand management, strategy, research, or planning, whether at an agency or on the client side.",
      "A track record of turning data and cultural signals into strategy that creative teams can use.",
      "Strong analytical ability and the communication skill to make numbers make sense to a room full of people who would rather not do the math themselves.",
      "Comfort reading social, cultural, and platform trends and turning them into brand thinking.",
      "Hands-on experience with AI research and analysis tools, along with the judgement to catch them when they get something wrong.",
      "A clear point of view you are willing to defend in a room, instead of three safe options presented with equal weight.",
    ],
    responsibilities: [
      "Shape brand and communication strategy using research and real-world insight.",
      "Translate data, behaviour, and culture into ideas our creative teams can build on.",
      "Lead and mentor a team of planners, helping them grow their thinking and their craft.",
      "Work closely with creative leadership from the first brief through to execution.",
      "Represent strategy with confidence and clarity when you are in the room with a client.",
      "Use AI tools to move faster while keeping the interrogation and judgement your own.",
    ],
    about: [
      "BBDO West Africa is part of BBDO Worldwide, one of the most creatively awarded agency networks. We operate with all the benefits of a regional agency invested in breakthrough creative, with the ability to tap into the resources of the global BBDO and Omnicom networks to bring our ideas to life.",
      "With insight and imagination, we work to solve problems with creativity every day.",
    ],
    schedule: "4 days in office each week",
    salary: "Competitive",
  },
  {
    slug: "pr-editorial-lead",
    title: "PR & Editorial Lead",
    department: "Influence & Media",
    location: "Lagos",
    workMode: "On-site",
    status: "closed",
  },
  {
    slug: "creator-partnerships-media-performance",
    title: "Creator Partnerships, Media & Performance",
    department: "Influence & Media",
    location: "Lagos",
    workMode: "Remote",
    status: "closed",
  },
  {
    slug: "head-of-production",
    title: "Head of Production",
    department: "Studio & Production",
    location: "Lagos",
    workMode: "On-site",
    status: "closed",
  },
  {
    slug: "production-motion-editing",
    title: "Production, Motion & Editing",
    department: "Studio & Production",
    location: "Lagos",
    workMode: "On-site",
    status: "closed",
  },
  {
    slug: "senior-art-director",
    title: "Senior Art Director",
    department: "Creative",
    location: "Victoria Island, Lagos",
    workMode: "Hybrid",
    status: "open",
    summary:
      "At BBDO West Africa, we treat art direction as visual problem solving, and we care about craft, typography, and execution without losing sight of the idea underneath it all. We are looking for a Senior Art Director who can see the whole campaign in their head before the deck is even open and still explain it plainly once they are sitting across from a client.",
    description:
      "The Senior Art Director sets the visual standard for the agency's output, leading visual work for a group of clients who expect world-class craft even when the budget is tight, and who care about how consistent the brand looks once it is on the market. You will mentor designers, brief outside talent, and defend your design choices with reasoning that holds up in the room.",
    qualifications: [
      "5 to 9 years of agency art direction experience, with a portfolio that shows real attention to detail.",
      "The ability to think in motion and digital just as fluently as you think in static imagery.",
      "Experience briefing a photographer, director, or illustrator, and getting work out of them that is better than what they would have done alone.",
      "Hands-on skill with AI image and video generation tools, and a clear sense of when using one helps the work.",
      "Experience producing vertical, social-first formats from the start, rather than adapting something built for a bigger screen.",
      "A genuine partnership mentality, and close working relationships with the writers you sit next to.",
    ],
    responsibilities: [
      "Set the visual standard for the agency's output.",
      "Translate abstract concepts into visual campaigns across film, digital, print, and experiential that stop people.",
      "Mentor designers and art directors and help develop their eyes as well as their technical skills.",
      "Explain and defend design choices in client rooms with reasoning grounded in strategy.",
      "Use generative tools such as Midjourney, Firefly, and Runway for concepting, mood boards, and rapid iteration, with the taste to know what is worth shipping.",
    ],
    about: [
      "BBDO West Africa is part of BBDO Worldwide, one of the most creatively awarded agency networks. We operate with all the benefits of a regional agency invested in breakthrough creative, with the ability to tap into the resources of the global BBDO and Omnicom networks to bring our ideas to life.",
      "With insight and imagination, we work to solve problems with creativity every day.",
    ],
    schedule: "4 days in office each week",
    salary: "Competitive",
  },
  {
    slug: "senior-copywriter",
    title: "Senior Copywriter",
    department: "Creative",
    location: "Victoria Island, Lagos",
    workMode: "Hybrid",
    status: "open",
    summary:
      "At BBDO West Africa, we believe well-crafted writing changes how people think and act, and we hold onto that belief on every brief, no matter how small it seems on the surface. We are looking for a Senior Copywriter who shares that respect for the craft and is ready to spend more of their time leading, editing, and pushing for the ideas worth fighting for.",
    description:
      "The Senior Copywriter leads verbal identity and conceptual thinking for a roster of clients who expect big ideas, prefer a tight headline over a long manifesto, and want work that feels premium and considered. You will work closely with our art direction team, and you will take an active hand in mentoring the writers coming up behind you.",
    qualifications: [
      "5 to 9 years of agency copywriting experience, backed by a portfolio of work that actually ran in market rather than sat in an awards entry.",
      "A strong command of grammar, along with the judgement to know when breaking a rule on purpose is the better choice.",
      "Range: you can write something short, like a billboard line, and something long, like a script, and give both equal care.",
      "Fluency writing for platform-native short form, including TikTok, Reels, and Shorts.",
      "Comfort directing and editing AI-generated copy so it reads like a person wrote it and sounds like the brand.",
      "A coachable mindset. You take a note well and come back with something better, not something defensive.",
    ],
    responsibilities: [
      "Turn strategy into creative platforms that move people.",
      "Mentor and edit junior to mid-level writers and help them grow their craft over time.",
      "Present to clients with enough conviction to sell the braver idea in the room.",
      "Work closely with Senior Art Directors so the words and the visuals feel like one thing.",
      "Use AI tools such as Claude and ChatGPT to speed up drafting and iteration, while keeping the thinking, the voice, and the final call your own.",
    ],
    about: [
      "BBDO West Africa is part of BBDO Worldwide, one of the most creatively awarded agency networks. We operate with all the benefits of a regional agency invested in breakthrough creative, with the ability to tap into the resources of the global BBDO and Omnicom networks to bring our ideas to life.",
      "With insight and imagination, we work to solve problems with creativity every day.",
    ],
    schedule: "4 days in office each week",
    salary: "Competitive",
  },
];

export function getJob(slug: string): Job | undefined {
  return JOBS.find((job) => job.slug === slug);
}

export function jobHref(slug: string): string {
  return `/dashboard/careers/${slug}`;
}
