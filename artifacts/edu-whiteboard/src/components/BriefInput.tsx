import React, { useState } from "react";
import { Send, Loader2, Lightbulb } from "lucide-react";

interface BriefInputProps {
  lessonId: number;
  lessonTitle: string;
  onGenerate: (brief: string) => Promise<void>;
  isGenerating: boolean;
}

const EXAMPLE_PROMPTS = [
  "Create a five-minute Grade 10 Accounting lesson explaining FIFO and AVCO. Use a grocery shop example, include calculations and end with three questions.",
  "Explain photosynthesis for Grade 8 Biology. Cover the light and dark reactions, and include a diagram of a chloroplast.",
  "Teach the Pythagorean theorem for Grade 9 Maths. Use a real-world example with a ladder against a wall.",
];

export default function BriefInput({
  lessonId,
  lessonTitle,
  onGenerate,
  isGenerating,
}: BriefInputProps) {
  const [brief, setBrief] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.trim() || isGenerating) return;
    await onGenerate(brief.trim());
  };

  return (
    <div className="flex flex-col gap-4" data-testid="brief-input">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-secondary" />
        <h3 className="font-serif text-lg font-bold text-foreground">
          {lessonTitle}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe the lesson you want to create..."
          className="w-full min-h-[120px] px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors resize-y placeholder:text-muted-foreground"
          data-testid="textarea-brief"
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setBrief(prompt)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 bg-muted rounded-md transition-colors"
                data-testid={`example-${i}`}
              >
                {prompt.slice(0, 40)}...
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isGenerating || !brief.trim()}
            className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            data-testid="button-generate"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
