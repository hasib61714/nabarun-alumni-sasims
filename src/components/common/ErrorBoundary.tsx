import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State { failed: boolean }

/** Last line of defence: a crash in one page shows a friendly screen instead of a blank site. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-3xl font-bold">কিছু একটা ভুল হয়েছে</h1>
        <p className="max-w-md text-muted-foreground">পেজটি দেখাতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন — সমস্যা থাকলে আমাদের জানান।</p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" /> আবার চেষ্টা করুন</Button>
          <Button variant="outline" onClick={() => { window.location.href = "/"; }}>হোমে ফিরুন</Button>
        </div>
      </div>
    );
  }
}
