import React, { useState } from "react";
import defaultAvatar from './assets/default-avatar.png';
import food from './assets/food.jpg';
import "./Profile.css"

interface Post {
  id: number;
  imageUrl: string;
  caption: string;
  likes: number;
  commentsCount: number;
}
{/* later we will make get request on pageload*/}
const testPosts: Post[] = [ 
  {id: 1, imageUrl: food, caption: "1 this pizza sucked", likes: 12, commentsCount: 3},
  {id: 2, imageUrl: food, caption: "2 this pizza sucked", likes: 12, commentsCount: 3},
  {id: 3, imageUrl: food, caption: "3 this pizza sucked", likes: 12, commentsCount: 3},
  {id: 4, imageUrl: food, caption: "4 this pizza sucked", likes: 12, commentsCount: 3},
];

const Profile = () => {
  const [posts, setPosts] = useState<Post[]>(testPosts);
  const [username] = useState("foodie123");
  const [displayName, setDisplayName] = useState("glizzygulper99");
  const [bio, setBio] = useState("test bio");
  const [isEditing, setIsEditing] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState(displayName);
  const [tempBio, setTempBio] = useState(bio);
  const [followers] = useState(2);
  const [following] = useState(1);

  function editProfile() {
    setIsEditing(true);
  }
  function cancelEdit() {
    setIsEditing(false);
  }
  // we need the setTempDisplayName and setTempBio stuff so it doesn't save if we want to cancel: intermediate values
  function saveProfile() {
    setDisplayName(tempDisplayName);
    setBio(tempBio);
    setIsEditing(false);
  }
  function deletePost(id: number) {
      setPosts(posts.filter((post) => post.id !== id));
  }

  return (
    <div>
    {/* user info */}
    <section>
      <img src={defaultAvatar} alt="Profile picture" width={100} height={100} />
      {isEditing ? (
        <>
          <input type="text"value={tempDisplayName} onChange={e => setTempDisplayName(e.target.value)} style={{fontSize: "1.5em", marginBottom: "8px"}}/>
          <br/>
          <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} rows={3} style={{width: "100%", marginBottom: "8px"}}/>
          <br/>
          <button onClick={saveProfile}>Save</button>
          <button onClick={cancelEdit} style={{marginLeft: "8px"}}>Cancel</button>
        </>
      ) : (
        <>
          <h2>{displayName} (@{username})</h2>
          <p>{bio}</p>
          <p>
            Followers: {followers} | Following: {following}
          </p>
          <button onClick={editProfile}>Edit Profile</button>
        </>
      )}
    </section>

    {/* comments and posts collection */}
      <section>
        <h3>Your Posts</h3>
        {posts.length === 0 ? (<p>No posts yet.</p>) : 
        (
        <div className="comments-grid">
        {posts.map((post) => (
          <div className="comment-card" key={post.id}>
          <img src={post.imageUrl} alt={post.caption} width={400} style={{borderRadius: '8px', objectFit: 'cover', width: '100%', height: '180px'}} />
          <p>{post.caption.length > 50 ? post.caption.slice(0, 50) + "..." : post.caption}</p>
          <p>Likes: {post.likes} | Comments: {post.commentsCount}</p>
          <button onClick={() => deletePost(post.id)}>Delete Post</button>
          </div>
        ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Profile;