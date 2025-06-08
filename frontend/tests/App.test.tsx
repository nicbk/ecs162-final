import { test, expect } from 'vitest'
import { page } from '@vitest/browser/context'
import { MemoryRouter } from 'react-router-dom' //Learned to use memoryrouter for unit testing capstone
import App from '../src/App'

test('navigates to Home and shows content', async () => {

  // Auth Provider needed for context and memory router since App.tsx is where we reroute to different pages
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )

  //Home page should now be rendered
  await expect.element(page.getByText("Taco Bell")).toBeVisible()
})

test('Home page, test comment posting', async () => {
  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )
  //Open the menu
  const openButton = screen.getByLabelText("Open menu");
  expect(openButton).toBeVisible();
  await openButton.click()

  //Close menu
  const closeButton = screen.getByLabelText("Close menu");
  await closeButton.click();

  //Test comment button
  const commentButton = screen.getByLabelText("Comment").first();
  await commentButton.click();

  //add comment to textbox
  const commentTextarea = screen.getByRole('textbox');
  await commentTextarea.fill("This is my comment");

  //Post comment
  const postButton = screen.getByText('Post!');
  await postButton.click();

  //Comment menu should still be open and comment at top
  expect(screen.getByText("This is my comment")).toBeVisible();

})

test('Home page, test share button', async () => {
  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )
  //Open the menu
  const openButton = screen.getByLabelText("Open menu");
  expect(openButton).toBeVisible();
  await openButton.click()

  //Close menu
  const closeButton = screen.getByLabelText("Close menu");
  await closeButton.click();

  //Test share button
  const shareButton = screen.getByLabelText("Share").first();
  await shareButton.click();

  //Comment menu should still be open and comment at top
  expect(screen.getByText("Share In-N-Out Burger")).toBeVisible();

})

test('Home page, test comment cancel', async () => {
  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )
  //Open the menu
  const openButton = screen.getByLabelText("Open menu");
  expect(openButton).toBeVisible();
  await openButton.click()

  //Close menu
  const closeButton = screen.getByLabelText("Close menu");
  await closeButton.click();

  //Test comment button
  const commentButton = screen.getByLabelText("Comment").first();
  await commentButton.click();

  //add comment to textbox
  const commentTextarea = screen.getByRole('textbox');
  await commentTextarea.fill("This is my comment");

  //Cancel comment
  const cancelButton = screen.getByText('Cancel');
  expect(cancelButton).toBeVisible();
  await cancelButton.click();

})


test('Opening and closing the sidebar', async () => {

  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
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

// *** PROFILE TESTS need to be changed to account for login now ***


// test('Go to profile page and back to home', async () => {
//   //On Home page
//   const screen = page.render(
//     <MemoryRouter initialEntries={['/Home']}>
//         <App />
//     </MemoryRouter>
//   )
//   //Open the menu
//   const openButton = screen.getByLabelText("Open menu");
//   expect(openButton).toBeVisible();
//   await openButton.click()

//   //Go to profile
//   const profileButton = screen.getByText('Profile');
//   await profileButton.click();

//   //Verify we are at profile page
//   const commentSection = screen.getByText("Your comments");
//   expect(commentSection).toBeVisible();

//   //Go back to home page
//   const homeButton = screen.getByText('Home');
//   await homeButton.click();

//   const likeButton = screen.getByLabelText("Like").first();
//   expect(likeButton).toBeVisible()
// })

// test('Go to profile page and editing bio', async () => {
//   //On Home page
//   const screen = page.render(
//     <MemoryRouter initialEntries={['/Home']}>
//         <App />
//     </MemoryRouter>
//   )
//   //Open the menu
//   const openButton = screen.getByLabelText("Open menu");
//   expect(openButton).toBeVisible();
//   await openButton.click()

//   //Go to profile
//   const profileButton = screen.getByText('Profile');
//   await profileButton.click();

//   //Close menu
//   const closeButton = screen.getByLabelText("Close menu");
//   await closeButton.click();

//   //See if original bio is there (test bio)
//   const originalBio = screen.getByText("test bio");
//   expect(originalBio).toBeVisible();

//   //Edit profile
//   const editProfileButton = screen.getByText('Edit Profile');
//   await editProfileButton.click();

//   //Get the bio area since can also edit username currently
//   const bioTextarea = screen.getByRole('textbox').nth(1);
//   await bioTextarea.fill("new bio");

//   // Save the changes
//   const saveButton = screen.getByText('Save');
//   await saveButton.click();

//   // Verify the new bio is displayed
//   const newBio = screen.getByText("new bio");
//   expect(newBio).toBeVisible();
// })

// test('Go to profile page and cancel bio edit', async () => {
//   //On Home page
//   const screen = page.render(
//     <MemoryRouter initialEntries={['/Home']}>
//         <App />
//     </MemoryRouter>
//   )
//   //Open the menu
//   const openButton = screen.getByLabelText("Open menu");
//   expect(openButton).toBeVisible();
//   await openButton.click()

//   //Go to profile
//   const profileButton = screen.getByText('Profile');
//   await profileButton.click();

//   //Close menu
//   const closeButton = screen.getByLabelText("Close menu");
//   await closeButton.click();

//   //See if original bio is there (test bio)
//   const originalBio = screen.getByText("test bio");
//   expect(originalBio).toBeVisible();

//   //Edit profile
//   const editProfileButton = screen.getByText('Edit Profile');
//   await editProfileButton.click();

//   //Get the bio area since can also edit username currently
//   const bioTextarea = screen.getByRole('textbox').nth(1);
//   await bioTextarea.fill("new bio");

//   // cancel the changes
//   const cancelButton = screen.getByText('Cancel');
//   await cancelButton.click();

//   // Verify the original bio is still there
//   const originalBio2 = screen.getByText("test bio");
//   expect(originalBio2).toBeVisible();
// })

// test('Go to profile page and look at favorites', async () => {
//   //On Home page
//   const screen = page.render(
//     <MemoryRouter initialEntries={['/Home']}>
//         <App />
//     </MemoryRouter>
//   )
//   //Open the menu
//   const openButton = screen.getByLabelText("Open menu");
//   expect(openButton).toBeVisible();
//   await openButton.click()

//   //Go to profile
//   const profileButton = screen.getByText('Profile');
//   await profileButton.click();

//   //Close menu
//   const closeButton = screen.getByLabelText("Close menu");
//   await closeButton.click();

//   //See if original bio is there (test bio)
//   const originalBio = screen.getByText("test bio");
//   expect(originalBio).toBeVisible();

//   //Edit profile
//   const editProfileButton = screen.getByText('Favorites');
//   await editProfileButton.click();

//   //should now see my favorite restaurants
//   expect(screen.getByText("My Favorite Restaurants")).toBeVisible();
// })

// test('Delete a post from profile', async () => {
//    //On Home page
//   const screen = page.render(
//     <MemoryRouter initialEntries={['/Home']}>
//         <App />
//     </MemoryRouter>
//   )
//   //Open the menu
//   const openButton = screen.getByLabelText("Open menu");
//   expect(openButton).toBeVisible();
//   await openButton.click()

//   //Go to profile
//   const profileButton = screen.getByText('Profile');
//   await profileButton.click();

//   //Close menu
//   const closeButton = screen.getByLabelText("Close menu");
//   await closeButton.click();

//   //Verify all posts intially
//   expect(screen.getByAltText("1 this pizza sucked")).toBeVisible();
//   expect(screen.getByAltText("2 this pizza sucked")).toBeVisible();
//   expect(screen.getByAltText("3 this pizza sucked")).toBeVisible();
//   expect(screen.getByAltText("4 this pizza sucked")).toBeVisible();

//   // Click the first post
//   const firstPost = screen.getByAltText("1 this pizza sucked");
//   await firstPost.click();

//   // Delete the post
//   const deleteButton = screen.getByText('Delete Post');
//   await deleteButton.click();

//    // Verify the first post is gone using try-catch timeout
//   try {
//     const deletedPost = screen.getByAltText("1 this pizza sucked", { timeout: 100 });
//     // If we get here, the post still exists (test should fail)
//     expect(false).toBe(true);
//   } catch (error) {
//     // Post was successfully deleted - this is what we want
//     expect(true).toBe(true);
//   }

//   // Verify the other 3 posts still exist
//   expect(screen.getByAltText("2 this pizza sucked")).toBeVisible();
//   expect(screen.getByAltText("3 this pizza sucked")).toBeVisible();
//   expect(screen.getByAltText("4 this pizza sucked")).toBeVisible();
// })