import { PublicTest } from './playgrounds/shared';
import { JsPlayground } from './playgrounds/js-playground';
import { ReactPlayground } from './playgrounds/react-playground';

interface PlaygroundProps {
  questionId: string;
  type: 'FUNCTION_JS' | 'REACT_APP';
  starterCode?: Record<string, string>;
  publicTests: PublicTest[];
}

export function ProblemPlayground({ questionId, type, starterCode, publicTests }: PlaygroundProps) {
  if (type === 'REACT_APP') {
    return (
      <ReactPlayground 
        questionId={questionId} 
        starterCode={starterCode} 
        publicTests={publicTests} 
      />
    );
  }

  return (
    <JsPlayground 
      questionId={questionId} 
      starterCode={starterCode} 
      publicTests={publicTests} 
    />
  );
}
