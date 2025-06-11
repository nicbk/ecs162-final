import { test, expect, vi, beforeAll } from 'vitest'
import { page } from '@vitest/browser/context'
import { MemoryRouter } from 'react-router-dom' //Learned to use memoryrouter for unit testing capstone
import App from '../src/App'

/*
 IMPORTANT NOTE: These tests can not "allow" a location when wanting to test nearby restaurants, so it will
 default to the Davis area. So prior to running this (as this is an integration test), sign on on the website,
 deny access to your location so it also defaults to Davis (if you are not in Davis), then add a comment to a post and
 create a simple thread
*/

//To handle alerts and clipboard copies
beforeAll(()=> {
  //Alert mock
  vi.spyOn(window, 'alert').mockImplementation(() => {})

  //Mock clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve(''))
    },
    writable: true
  })
})

test('navigates to Home and shows content', async () => {

  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )

  try {
    //wait for 5 seconds
    await Promise.race([
      //Actual test
      expect.element(page.getByText("Restaurants")).toBeVisible(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Couldnt find home page after 5 seconds')), 5000)
      )
    ])
  } catch(error){
    //We timed out
    console.log(error.message)
    throw error
  }
})

test('Open Comment menu', async () => {

  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )

  try {

    await Promise.race([
      //Actual test
      (async () => {

        //Open the menu
        const openButton = screen.getByLabelText("Open menu");
        expect(openButton).toBeVisible();
        await openButton.click();

        // waits for 10 seconds for restaurants to load
        await new Promise(res => setTimeout(res, 10000));

        //Open comment menu of first post (defaults to Davis for testing)
        expect(screen.getByText("Davis").first()).toBeVisible();
        const commentButton = screen.getByLabelText("Comment").first();
        await commentButton.click();
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Couldnt open comments')), 30000)
      )
    ])
  }catch (error){
    //We timed out
    console.log(error.message)
    throw error
  }
}, 30000) //Custom timeout in case restaurant loading takes ages, can adjust as needed, just changed to 30s max

test('Leave a comment', async () => {

  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )

  try {

    await Promise.race([
      //Actual test
      (async () => {

        //Open the menu
        const openButton = screen.getByLabelText("Open menu");
        expect(openButton).toBeVisible();
        await openButton.click()

        //Close menu
        const closeButton = screen.getByLabelText("Close menu");
        await closeButton.click();

        // waits for 10 seconds for restaurants to load
        await new Promise(res => setTimeout(res, 10000));


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

      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Couldnt leave a comment')), 30000)
      )
    ])
  }catch (error){
    //We timed out
    console.log(error.message)
    throw error
  }
}, 30000) //Custom timeout in case restaurant loading takes ages, can adjust as needed, just changed to 30s max

test('Click wishlist on restaurant', async () => {

  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )

  try {

    await Promise.race([
      //Actual test
      (async () => {

        //Open the menu
        const openButton = screen.getByLabelText("Open menu");
        expect(openButton).toBeVisible();
        await openButton.click()

        //Close menu
        const closeButton = screen.getByLabelText("Close menu");
        await closeButton.click();

        // waits for 10 seconds for restaurants to load
        await new Promise(res => setTimeout(res, 10000));


        //Test wishlist button
        const likeButton = screen.getByLabelText("Add wishlist").first();
        await likeButton.click();

      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Couldnt click wishlist')), 30000)
      )
    ])
  }catch (error){
    //We timed out
    console.log(error.message)
    throw error
  }
}, 30000) //Custom timeout in case restaurant loading takes ages, can adjust as needed, just changed to 30s max

test('Click share on restaurant', async () => {

  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/Home']}>
        <App />
    </MemoryRouter>
  )

  try {

    await Promise.race([
      //Actual test
      (async () => {

        //Open the menu
        const openButton = screen.getByLabelText("Open menu");
        expect(openButton).toBeVisible();
        await openButton.click()

        //Close menu
        const closeButton = screen.getByLabelText("Close menu");
        await closeButton.click();

        // waits for 10 seconds for restaurants to load
        await new Promise(res => setTimeout(res, 10000));


        //Test comment button
        const shareButton = screen.getByLabelText("Share").first();
        await shareButton.click();

        //Share menu should be open
        expect(screen.getByText("Either copy and paste this to a new link or click the copy button to copy it to your clipboard")).toBeVisible();


      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Couldnt click share')), 30000)
      )
    ])
  }catch (error){
    //We timed out
    console.log(error.message)
    throw error
  }
}, 30000) //Custom timeout in case restaurant loading takes ages, can adjust as needed, just changed to 30s max

// *** Social/Threads*** (TESTS REQUIRE THAT SOME DATA WAS ADDED INTO THE MONGODB FIRST SINCE WE ARE DOING INTEGRATION TESTS)
test('Open thread from social page', async () => {

  //On Home page
  const screen = page.render(
    <MemoryRouter initialEntries={['/SocialMedia']}>
        <App />
    </MemoryRouter>
  )

  try {

    await Promise.race([
      //Actual test
      (async () => {

        // waits for 10 seconds for restaurants to load
        await new Promise(res => setTimeout(res, 10000));

        //Ensure toplevel comment exists
        expect(screen.getByText("Jolly")).toBeVisible();

        //Threads click
        const commentButton = screen.getByLabelText("Will be threads").first();
        await commentButton.click();

        //Test like button
        const likeButton = screen.getByLabelText("Like Comment").first();
        await likeButton.click();

        //Test share button
        const shareButton = screen.getByLabelText("Share Comment").first();
        await shareButton.click();

        //Should see replies on screen (MAKE SURE TO ADD THIS REPLY IN ACTUAL WEBSITE)
        expect(screen.getByText("I am a reply")).toBeVisible();

        //Get nested replies
        const nestedButton = screen.getByLabelText("Nested Replies").first();
        await nestedButton.click();
        expect(screen.getByText("@Andrew Ortega Bruh we know")).toBeVisible();

        //Copy nested reply link
        const replyShareButton = screen.getByLabelText("Reply Share Comment").first();
        await replyShareButton.click();


      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Couldnt view thread')), 30000)
      )
    ])
  }catch (error){
    //We timed out
    console.log(error.message)
    throw error
  }

}, 30000) //Custom timeout in case restaurant loading takes ages, can adjust as needed, just changed to 30s max
