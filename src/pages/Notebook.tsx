import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, StopCircle, Upload, CalendarPlus } from "lucide-react";

// Simple notebook page providing voice->text, rich-text editing, image uploads and Google Calendar scheduling
const Notebook: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [note, setNote] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const [notes, setNotes] = useState<{title:string;content:string;created:string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('legalops_notes')||'[]'); } catch { return []; }
  });
  const [meetings, setMeetings] = useState<{title:string;start:string;end:string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('legalops_meetings')||'[]'); } catch { return []; }
  });
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Voice recording start
  const handleStartRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({ title: "Unsupported", description: "Speech recognition is not supported in this browser.", variant: "destructive" });
      return;
    }
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map(r => r[0])
        .map(r => r.transcript)
        .join(' ');
      setNote(prev => prev + ' ' + transcript);
    };
    recognition.onerror = (err: any) => {
      console.error(err);
      toast({ title: "Recording error", description: err.error || 'Unknown error', variant: "destructive" });
    };
    recognition.onend = () => {
      setRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  const handleStopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const imgMarkdown = `\n![Uploaded Image](${base64})\n`;
      setNote(prev => prev + imgMarkdown);
    };
    reader.readAsDataURL(file);
  };

  // Meeting scheduling via Google Calendar create-event link
  const handleScheduleMeeting = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60000);
    const titleRaw = note.split("\n")[0] || 'Notebook Meeting';
    const meetingEntry = { title: titleRaw, start: now.toISOString(), end: end.toISOString() };
    const newMeetings = [...meetings, meetingEntry];
    setMeetings(newMeetings);
    localStorage.setItem('legalops_meetings', JSON.stringify(newMeetings));

    const title = encodeURIComponent(titleRaw);
    const details = encodeURIComponent(note);
    const startISO = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const endISO = end.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${startISO}/${endISO}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 min-h-screen flex flex-col" style={{background: 'linear-gradient(180deg,#ffe6f2 0%, #ffffff 40%)'}}>
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" onClick={() => navigate('/tools')}>← Back to Tools</Button>
        <h1 className="text-2xl font-bold">Notebook</h1>
      </div>
      <div className="max-w-4xl w-full mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Take Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {!recording ? (
                <Button onClick={handleStartRecording} variant="secondary" className="flex items-center gap-1"><Mic className="w-4 h-4"/> Record</Button>
              ) : (
                <Button onClick={handleStopRecording} variant="destructive" className="flex items-center gap-1"><StopCircle className="w-4 h-4"/> Stop</Button>
              )}
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1">
                <Upload className="w-4 h-4"/> Image
              </Button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <Button variant="secondary" onClick={handleScheduleMeeting} className="flex items-center gap-1"><CalendarPlus className="w-4 h-4"/> Schedule Meeting</Button>
              <Button variant="secondary" onClick={() => {
                if(!note.trim()) { toast({title:'Empty note',description:'Type something first'});return;}
                const title = note.split("\n")[0].slice(0,50)||'Untitled Note';
                const entry = {title, content: note, created: new Date().toISOString()};
                const newNotes = [...notes, entry];
                setNotes(newNotes);
                localStorage.setItem('legalops_notes', JSON.stringify(newNotes));
                toast({title:'Note saved'});
              }} className="flex items-center gap-1">Save Note</Button>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Start typing your notes…"
              className="w-full h-80 border rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">Notes and meetings are auto-saved in your browser.</p>
          </CardContent>
        </Card>
      </div>
      {/* sidebar */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
        <div className="md:col-span-2"></div>
        <div className="bg-white/70 rounded shadow p-4 space-y-4">
          <h2 className="font-semibold text-pink-600">Saved Notes</h2>
          {notes.length===0 && <p className="text-sm text-gray-500">No notes yet.</p>}
          {notes.map((n,i)=>(<div key={i} className="border-b pb-2 mb-2 cursor-pointer" onClick={()=>setNote(n.content)}>
            <p className="font-medium text-sm">{n.title}</p>
            <p className="text-xs text-gray-400">{new Date(n.created).toLocaleString()}</p>
          </div>))}
          <h2 className="font-semibold text-pink-600 mt-4">Meetings</h2>
          {meetings.length===0 && <p className="text-sm text-gray-500">No meetings yet.</p>}
          {meetings.map((m,i)=>(<div key={i} className="border-b pb-2 mb-2">
            <p className="font-medium text-sm">{m.title}</p>
            <p className="text-xs text-gray-400">{new Date(m.start).toLocaleString()}</p>
          </div>))}
        </div>
      </div>
    </div>
  );
};

export default Notebook;
