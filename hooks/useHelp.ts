import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface HelpQuiz {
  question: string;
  options: string[];
  correct: number;
  pass_threshold?: number;
}

export interface HelpItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  quiz_json: HelpQuiz | null;
  target_path: string;
  target_section: string | null;
  target_element: string | null;
  portal: "owner" | "staff" | "both";
}

export async function fetchHelp(
  targetPath: string,
  portal: "owner" | "staff",
): Promise<HelpItem[]> {
  return api.get<HelpItem[]>(
    `/public-help?target_path=${encodeURIComponent(targetPath)}&portal=${portal}`,
  );
}

export function useHelp(targetPath: string, portal: "owner" | "staff") {
  return useQuery({
    queryKey: ["help", targetPath, portal],
    queryFn: () => fetchHelp(targetPath, portal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
