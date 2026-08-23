import { Link, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PresentationPlayback } from "@/components/PresentationPlayback";
import { useDemoPresentationState } from "@/components/demo/useDemoPresentationState";

export function DemoPresentationPage() {
  const navigate = useNavigate();
  const demo = useDemoPresentationState();

  return (
    <PresentationPlayback
      title={demo.state.title}
      slides={demo.state.slides}
      ariaLabel="Recruiter demo presentation"
      onExit={() => navigate("/demo")}
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link to="/demo">
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to demo
            </Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={demo.resetDemo}>
            <RotateCcwIcon className="mr-2 size-4" />
            Reset
          </Button>
        </>
      }
    />
  );
}
