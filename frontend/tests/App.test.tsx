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

  //Should be on home screen with a like button
  const likeButton = screen.getByLabelText("Like").first();
  expect(likeButton).toBeVisible()
})

test('Go to profile page and back to home', async () => {
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

  //Go to profile
  const profileButton = screen.getByText('Profile');
  await profileButton.click();

  //Verify we are at profile page
  const commentSection = screen.getByText("Your comments");
  expect(commentSection).toBeVisible();

  //Go back to home page
  const homeButton = screen.getByText('Home');
  await homeButton.click();

  const likeButton = screen.getByLabelText("Like").first();
  expect(likeButton).toBeVisible()
})

test('Go to profile page and editing bio', async () => {
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

  //Go to profile
  const profileButton = screen.getByText('Profile');
  await profileButton.click();

  //Close menu
  const closeButton = screen.getByLabelText("Close menu");
  await closeButton.click();

  //See if original bio is there (test bio)
  const originalBio = screen.getByText("test bio");
  expect(originalBio).toBeVisible();

  //Edit profile
  const editProfileButton = screen.getByText('Edit Profile');
  await editProfileButton.click();

  //Get the bio area since can also edit username currently
  const bioTextarea = screen.getByRole('textbox').nth(1);
  await bioTextarea.fill("new bio");

  // Save the changes
  const saveButton = screen.getByText('Save');
  await saveButton.click();

  // Verify the new bio is displayed
  const newBio = screen.getByText("new bio");
  expect(newBio).toBeVisible();
})

test('Go to profile page and cancel bio edit', async () => {
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

  //Go to profile
  const profileButton = screen.getByText('Profile');
  await profileButton.click();

  //Close menu
  const closeButton = screen.getByLabelText("Close menu");
  await closeButton.click();

  //See if original bio is there (test bio)
  const originalBio = screen.getByText("test bio");
  expect(originalBio).toBeVisible();

  //Edit profile
  const editProfileButton = screen.getByText('Edit Profile');
  await editProfileButton.click();

  //Get the bio area since can also edit username currently
  const bioTextarea = screen.getByRole('textbox').nth(1);
  await bioTextarea.fill("new bio");

  // cancel the changes
  const cancelButton = screen.getByText('Cancel');
  await cancelButton.click();

  // Verify the original bio is still there
  const originalBio2 = screen.getByText("test bio");
  expect(originalBio2).toBeVisible();
})
