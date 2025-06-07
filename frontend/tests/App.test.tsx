import { test, expect } from 'vitest'
import { page } from '@vitest/browser/context'
import { MemoryRouter } from 'react-router-dom' //Learned to use memoryrouter for unit testing capstone
import App from '../src/App'
import { AuthProvider } from '../src/contexts/AuthContext'

test('navigates to Home and shows content', async () => {

  // Auth Provider needed for context and memory router since App.tsx is where we reroute to different pages
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  )

  //Home page should now be rendered
  await expect.element(page.getByText("Taco Bell")).toBeVisible()
})

test('Opening and closing the sidebar', async () => {

  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  )
  //Open the menu
  const openButton = screen.getByLabelText("Open menu");
  expect(openButton).toBeVisible();
  await openButton.click()

  //Now foodie text should be on screen
  await expect.element(page.getByText("Foodie")).toBeVisible()

  //Close menu now
  const closeButton = screen.getByLabelText("Close menu");
  expect(closeButton).toBeVisible();
  await closeButton.click();

  //foodie text should no longer be on screen
  await expect.element(page.getByText("Foodie")).not.toBeVisible();
})
