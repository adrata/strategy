export interface CoverSlideData {
  title: string;
  subtitle: string;
  date: string;
  presenter: string;
}

export interface PurposeSlideData {
  title: string;
  content: string;
  description: string;
}

export interface MissionSlideData {
  title: string;
  targets: Array<{
    label: string;
    value: string;
    progress: number;
  }>;
}

export interface ValuesSlideData {
  title: string;
  values: Array<{
    name: string;
    description: string;
  }>;
}

export interface ProgressSlideData {
  title: string;
  metrics: Array<{
    label: string;
    value: string;
    change: string;
  }>;
}

export interface StoriesSlideData {
  title: string;
  stories: string[];
}

export interface UnderstandingSlideData {
  title: string;
  insights: string[];
}

export interface FrameworksSlideData {
  title: string;
  departments: Array<{
    name: string;
    framework: string;
  }>;
}

export interface DirectionSlideData {
  title: string;
  priorities: string[];
}

export interface OutroSlideData {
  title: string;
  quote: string;
  author: string;
  message: string;
}

export interface PitchContent {
  slides: {
    cover?: CoverSlideData;
    purpose?: PurposeSlideData;
    mission?: MissionSlideData;
    values?: ValuesSlideData;
    progress?: ProgressSlideData;
    stories?: StoriesSlideData;
    understanding?: UnderstandingSlideData;
    frameworks?: FrameworksSlideData;
    direction?: DirectionSlideData;
    outro?: OutroSlideData;
  };
}

export function getDefaultPitchContent(): PitchContent {
  return {
    slides: {
      cover: {
        title: 'New Presentation',
        subtitle: 'Workbench Document',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        presenter: ''
      },
      purpose: {
        title: 'Our Purpose',
        content: '',
        description: ''
      },
      mission: {
        title: 'Our Mission',
        targets: [
          { label: '', value: '', progress: 0 }
        ]
      },
      values: {
        title: 'Our Core Values',
        values: [
          { name: '', description: '' }
        ]
      },
      progress: {
        title: 'Progress Against Mission',
        metrics: [
          { label: '', value: '', change: '' }
        ]
      },
      stories: {
        title: 'Key Stories',
        stories: ['']
      },
      understanding: {
        title: 'Key Learnings',
        insights: ['']
      },
      frameworks: {
        title: 'Department Frameworks',
        departments: [
          { name: '', framework: '' }
        ]
      },
      direction: {
        title: 'Next Steps',
        priorities: ['']
      },
      outro: {
        title: 'Together We Build the Future',
        quote: '',
        author: '',
        message: ''
      }
    }
  };
}
