import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { StoreProvider } from './store/store';
import TabBar from './components/TabBar';
import Home from './pages/Home';
import Courses from './pages/Courses';
import LessonPage from './pages/Lesson';
import LabPage from './pages/Lab';
import Mistakes from './pages/Mistakes';
import Me from './pages/Me';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Graph from './pages/Graph';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollTop />
        <div className="min-h-screen bg-paper">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/lesson/:id" element={<LessonPage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/lab/:id" element={<LabPage />} />
            <Route path="/mistakes" element={<Mistakes />} />
            <Route path="/me" element={<Me />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <TabBar />
        </div>
      </HashRouter>
    </StoreProvider>
  );
}
