
import styles from './Profile.module.scss';
import React, { useState } from "react";
import defaultAvatar from '../../assets/default-avatar.png';
import food from '../../assets/food.jpg';

interface Post {
  id: number;
  imageUrl: string;
  comment: string;
  likes: number;
  commentsCount: number;
}
{/* later we will make get request on pageload*/}
const testPosts: Post[] = [ 
  {id: 1, imageUrl: food, comment: "1 this pizza sucked", likes: 12, commentsCount: 3},
  {id: 2, imageUrl: food, comment: "2 this pizza sucked", likes: 12, commentsCount: 3},
  {id: 3, imageUrl: food, comment: "3 this pizza sucked", likes: 12, commentsCount: 3},
  {id: 4, imageUrl: food, comment: "4 this pizza sucked", likes: 12, commentsCount: 3},
];

const Profile = () => {
  const [posts, setPosts] = useState<Post[]>(testPosts);
  const [username] = useState("foodie123");
  const [displayName, setDisplayName] = useState("glizzygulper");
  const [bio, setBio] = useState("test bio");
  const [isEditing, setIsEditing] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState(displayName);
  const [tempBio, setTempBio] = useState(bio);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
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
        <div className={styles.galleryGrid}>
          {posts.map((post) => (
            <div className={styles.galleryImageWrapper} key={post.id}>
              <img
                src={post.imageUrl}
                alt={post.comment}
                className={styles.galleryImage}
                onClick={() => setSelectedPost(post)}
              />
            </div>
          ))}
        </div>
        )}
        {selectedPost && (
        <div className={styles.popupOverlay} onClick={() => setSelectedPost(null)}>
          <div className={styles.popupContent} onClick={e => e.stopPropagation()}>
            <img src={selectedPost.imageUrl} alt={selectedPost.comment} style={{width: '100%', borderRadius: '8px'}} />
            <p>{selectedPost.comment}</p>
            <p>Likes: {selectedPost.likes} | Comments: {selectedPost.commentsCount}</p>
            <button onClick={() => { deletePost(selectedPost.id); setSelectedPost(null); }}>Delete Post</button>
            <button onClick={() => setSelectedPost(null)} style={{marginLeft: "8px"}}>Close</button>
          </div>
        </div>
      )}
      </section>
    </div>
  );
};

export default Profile;