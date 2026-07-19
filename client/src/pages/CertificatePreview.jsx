import { GraduationCap, Download, Share2, QrCode, Linkedin } from 'lucide-react';
import Button from '../components/Button';

/**
 * Preview: http://localhost:5173/certificate-preview
 */
export default function CertificatePreview() {
  const data = {
    studentName: 'Uday Pratap Singh',
    courseTitle: 'MERN Stack Development',
    certificateId: 'LH2024MERN1001',
    date: '27 May 2024',
    instructorName: 'Rohit Kumar',
    year: new Date().getFullYear(),
  };

  const verifyUrl = `https://learnhub.app/verify/${data.certificateId}`;

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-600">Certificate preview — download, verify & share</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button variant="outline" onClick={() => navigator.clipboard?.writeText(verifyUrl)}>
              <QrCode className="mr-2 h-4 w-4" /> Copy verify link
            </Button>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="secondary">
                <Linkedin className="mr-2 h-4 w-4" /> Share on LinkedIn
              </Button>
            </a>
            <Button onClick={() => navigator.share?.({ title: 'My LearnHub Certificate', url: verifyUrl })}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </div>
        <div
          className="relative mx-auto aspect-[297/210] w-full max-w-[920px] overflow-hidden bg-[#faf8f5] shadow-2xl"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          <div className="absolute inset-3 rounded-sm border-2 border-[#c9a227]" />
          <div className="absolute inset-5 rounded-sm border border-[#a67c00]" />
          <div className="absolute left-3 top-3 border-l-[60px] border-t-[60px] border-l-[#1a2f4a] border-t-transparent" />
          <div className="absolute left-3 top-3 border-l-[36px] border-t-[36px] border-l-[#c9a227] border-t-transparent" />
          <div className="absolute bottom-3 right-3 border-b-[60px] border-r-[60px] border-b-[#1a2f4a] border-r-transparent" />
          <div className="absolute bottom-3 right-3 border-b-[36px] border-r-[36px] border-b-[#c9a227] border-r-transparent" />

          <div className="absolute right-10 top-10 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-[#c9a227] text-center text-[8px] font-bold">
            <span className="text-[#1a2f4a]">VERIFIED</span>
            <span className="text-sm text-[#1a2f4a]">{data.year}</span>
          </div>

          <div className="relative flex h-full flex-col px-8 pb-16 pt-10">
            <div className="flex items-center justify-center gap-2">
              <GraduationCap className="h-10 w-10 text-primary-600" strokeWidth={2} />
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  <span className="text-[#1a2f4a]">Learn</span>
                  <span className="text-[#d97706]">Hub</span>
                </p>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  Online Learning Platform
                </p>
              </div>
            </div>

            <h1 className="mt-5 text-center text-4xl font-bold tracking-widest text-[#1a2f4a]">CERTIFICATE</h1>
            <p
              className="text-center text-sm font-bold tracking-[0.3em] text-[#c9a227]"
              style={{ fontFamily: 'Helvetica, sans-serif' }}
            >
              OF COMPLETION
            </p>

            <p className="mt-5 text-center text-sm text-gray-500">This is to certify that</p>
            <p
              className="mt-2 text-center text-3xl font-bold italic text-[#1a2f4a]"
              style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
            >
              {data.studentName}
            </p>
            <p className="mt-4 text-center text-sm text-gray-500">has successfully completed the online course</p>
            <p className="mt-2 text-center text-xl font-bold text-[#1a2f4a]">{data.courseTitle}</p>
            <p className="mx-auto mt-2 max-w-md text-center text-xs text-gray-500">
              on the LearnHub platform and has met all requirements for this course.
            </p>

            <div className="mt-auto pt-6 text-center">
              <p className="font-['Segoe Script',cursive] text-lg text-gray-700">{data.instructorName}</p>
              <div className="mx-auto my-1 h-px w-36 bg-gray-400" />
              <p className="text-sm font-bold text-[#1a2f4a]" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                {data.instructorName}
              </p>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                Course Instructor
              </p>
              <p className="mt-2 text-xs font-semibold text-primary-600" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                Issued by LearnHub · Online Learning Platform
              </p>
            </div>
          </div>

          {/* Footer — fixed bottom corners (same as PDF) */}
          <div
            className="pointer-events-none absolute bottom-8 left-10 right-10 flex items-end justify-between text-xs font-bold text-[#1a2f4a]"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            <span>Certificate ID: {data.certificateId}</span>
            <span>Date: {data.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
