import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

export default function QuizPage() {
  const { courseId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
    api
      .get(`/quiz/course/${courseId}`)
      .then((r) => {
        const q = r.data.data;
        setQuiz(q);
        setTimeLeft((q.timeLimitMinutes || 30) * 60);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load quiz');
      });
  }, [courseId]);

  useEffect(() => {
    if (!quiz || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((x) => x - 1), 1000);
    return () => clearInterval(t);
  }, [quiz, timeLeft]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const submit = async () => {
    const answerArr = quiz.questions.map((_, i) => answers[i] ?? -1);
    const { data } = await api.post(`/quiz/${quiz._id}/attempt`, { answers: answerArr });
    alert(`Score: ${data.data.score}% - ${data.data.passed ? 'Passed!' : 'Failed'}`);
    navigate('/dashboard/learning');
  };

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-red-600">{error}</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard/learning')}>
          Back to My Learning
        </Button>
      </div>
    );
  }

  if (!quiz) return <div className="p-8">Loading quiz...</div>;

  const q = quiz.questions[current];
  const status = (i) => {
    if (marked[i]) return 'bg-amber-400';
    if (answers[i] !== undefined) return 'bg-green-500';
    return 'bg-red-400';
  };

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <div className="flex-1 rounded-xl border bg-white p-8">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Question {current + 1} of {quiz.questions.length}</span>
          <span className="font-mono text-red-600">{formatTime(timeLeft)}</span>
        </div>
        <h2 className="mt-6 text-xl font-semibold">{q.text}</h2>
        <div className="mt-6 space-y-3">
          {q.options.map((opt, i) => (
            <label key={i} className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-gray-50">
              <input
                type="radio"
                name="answer"
                checked={answers[current] === i}
                onChange={() => setAnswers({ ...answers, [current]: i })}
              />
              {opt}
            </label>
          ))}
        </div>
        <div className="mt-8 flex justify-between">
          <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
            Previous
          </Button>
          {current < quiz.questions.length - 1 ? (
            <Button onClick={() => setCurrent((c) => c + 1)}>Next</Button>
          ) : (
            <Button onClick={submit}>Submit Quiz</Button>
          )}
        </div>
      </div>
      <aside className="w-48 shrink-0">
        <p className="mb-2 text-sm font-medium">Questions</p>
        <div className="grid grid-cols-5 gap-2">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                setMarked({ ...marked, [i]: !marked[i] });
              }}
              className={`h-9 w-9 rounded text-xs font-bold text-white ${status(i)} ${
                current === i ? 'ring-2 ring-primary-600' : ''
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">Right-click to mark for review</p>
      </aside>
    </div>
  );
}
