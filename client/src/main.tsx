import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AboutPage from './pages/AboutPage.tsx'
import MenuPage from './pages/MenuPage.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // { index: true, element: <HomePage /> }, // Index route for the home page
      // { path: 'about', element: <AboutPage /> },
    ],
  },
  {
    path: '/about',
    element: <AboutPage />
  },
  {
    path: "/menu/:hallName/:mealPeriod",
    element: <MenuPage />
  }
])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router}/>
    </QueryClientProvider>
  </StrictMode>,
)
