import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { tools } from '../tools/registry'
import { Layout } from './Layout'
import { Home } from './Home'

// BASE_URL is "/" on Vercel or "/<repo>/" on GitHub Pages.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export function App() {
  // useTransitions={false}: URL updates must be synchronous, otherwise controlled inputs whose
  // value lives in the query string (useUrlState) drop keystrokes and lose the caret.
  return (
    <BrowserRouter basename={basename} useTransitions={false}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          {tools.map((t) => (
            <Route key={t.id} path={`${t.path}/*`} element={<t.component />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
