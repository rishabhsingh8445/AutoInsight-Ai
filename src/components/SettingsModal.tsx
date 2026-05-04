import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/dataStore";
import { Check } from "lucide-react";

export function SettingsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { groqKey, setGroqKey } = useSettingsStore();
  const [g, setG] = useState(groqKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setG(groqKey);
      setSaved(false);
    }
  }, [open, groqKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-glass-border">
        <DialogHeader>
          <DialogTitle>API Key</DialogTitle>
          <DialogDescription>Stored locally in your browser.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="groq">Groq API Key</Label>
            <Input id="groq" type="password" value={g} onChange={(e) => setG(e.target.value)} placeholder="gsk_..." />
          </div>
        </div>
        <Button
          onClick={() => {
            setGroqKey(g);
            setSaved(true);
            setTimeout(() => onOpenChange(false), 800);
          }}
          className="gradient-bg"
        >
          {saved ? <><Check className="mr-2 h-4 w-4" /> Saved</> : "Save Key"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}