import { redirect } from 'next/navigation';

export default function HomePage() {
  // Main domain shows the project site for SEO.
  // Dashboard is accessible at /dashboard.
  redirect('/project');
}
