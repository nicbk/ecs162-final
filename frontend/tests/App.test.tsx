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


test('Go to profile page and back to home', async () => {
  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Profile']}>
        <App />
    </MemoryRouter>
  )
  //Open the menu
  const openButton = screen.getByLabelText("Open menu");
  expect(openButton).toBeVisible();
  await openButton.click()

  //Verify we are at profile page
  const commentSection = screen.getByText("Posts").nth(1);
  expect(commentSection).toBeVisible();

  //Go back to home page
  const homeButton = screen.getByText('Home');
  await homeButton.click();

  const likeButton = screen.getByLabelText("Like").first();
  expect(likeButton).toBeVisible()
})

test('Delete a post from profile', async () => {
   //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Profile']}>
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

  //Verify all posts intially
  expect(screen.getByText("4 Posts")).toBeVisible();

  //Click first post
  const firstPost = screen.getByRole('img').last();
  await firstPost.click();

  //Delete the post
  const deleteButton = screen.getByText("Delete Post");
  await deleteButton.click();

  //Verify 3 posts left
  expect(screen.getByText("3 Posts")).toBeVisible();
})

test('Delete all posts from profile', async () => {
   //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Profile']}>
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

  //Click last post
  const lastPost = screen.getByRole('img').last();
  await lastPost.click();

  //Delete the post
  const deleteButton = screen.getByText("Delete Post");
  await deleteButton.click();

  //Verify 3 posts intially
  expect(screen.getByText("3 Posts")).toBeVisible();

  //Delete all 3 posts
  for (let i = 0; i < 3; i++){
    // Get the 3 remaining posts using simple regex
    const post = screen.getByAltText(/post/).last();
    await post.click();

    const deleteButton = screen.getByText("Delete Post");
    await deleteButton.click();

  }

  expect(screen.getByText("0 Posts")).toBeVisible();
  expect(screen.getByText("No posts yet.")).toBeVisible();
})

// *** Social test ***
test('Test navigation between social and home page', async () => {
   //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )
  //Visit social tab
  const socialButton = screen.getByText("Social");
  await socialButton.click();

  // Should see social page title
  expect(screen.getByText("Social page")).toBeVisible();

  //Go back to home page
  const homeButton = screen.getByText("Home").first();
  await homeButton.click();

  // See home page title
  expect(screen.getByText("Restaurants")).toBeVisible();

})

test('Test social page like feature', async () => {
   //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/SocialMedia']}>
        <App />
    </MemoryRouter>
  )

  // Should see social page title
  expect(screen.getByText("Social page")).toBeVisible();

  //Get first post like button
  const likeButton = screen.getByLabelText("Like Comment").first();
  await likeButton.click();

  //Theres now a post with 16 likes
  expect(screen.getByText("16")).toBeVisible();

  //Only 1 post with 15 likes
  expect(screen.getByText("15").length == 1);

  //Unlike the post
  await likeButton.click();

  //There should be 2 posts with 15 likes again
  expect(screen.getByText("15").length == 2);

})

test('Test social page share feature', async () => {
   //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/SocialMedia']}>
        <App />
    </MemoryRouter>
  )

  // Should see social page title
  expect(screen.getByText("Social page")).toBeVisible();

  //Get share button of first post
  const shareButton = screen.getByLabelText("Share Comment").first();
  await shareButton.click();

})

// *** THREADS TEST ***
test('Comprehensive thread test', async () => {
   //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )
  //Click first comment
  let commentButton = screen.getByLabelText("Comment").first();
  await commentButton.click();

  // Now within comment menu, click the first comment to resturant to open thread
  commentButton = screen.getByLabelText("Will be threads").first();
  await commentButton.click();

   //Open the menu
  const openButton = screen.getByLabelText("Open menu");
  expect(openButton).toBeVisible();
  await openButton.click()

  //Close menu
  const closeButton = screen.getByLabelText("Close menu");
  await closeButton.click();

  //Test like button
  const likeButton = screen.getByLabelText("Like Comment").first();
  await likeButton.click();

  //Test share button
  const shareButton = screen.getByLabelText("Share Comment").first();
  await shareButton.click();

  //Should now see replies
  expect(screen.getByText("I am a reply")).toBeVisible();

  //Get nested replies
  const nestedButton = screen.getByLabelText("Nested Replies").first();
  await nestedButton.click();
  expect(screen.getByText("@john bruh")).toBeVisible();

  //Copy nested reply link
  const replyShareButton = screen.getByLabelText("Reply Share Comment").first();
  await replyShareButton.click();
})

// *** Test google login ***
test('Try logging in', async () => {

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

  //Hit login button
  const loginButton = screen.getByText("Login");
  expect(loginButton).toBeVisible();
  await loginButton.click();
})
