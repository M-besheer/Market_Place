import { useState } from 'react'
import './Seller.css';

export default function CreateListing() {
  const [formData, setFormData] = useState({  //formData is an object holding everything in the form 
    title: '',
    description: '',
    price: '',
    delivery_days: '',
    category_id: '',
    image_url: ''   // we'll take a comma-separated string and split it later
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false) // success is a boolean that flips to true to track if listing creation was successful

  // handleChange is a generic function that updates a component's state in real-time as a user types or selects a value in a form element
  // e typically refers to the Event Object. It is a standard naming convention for the first argument passed to an event handler function
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  } // this function takes the existing formData object, spreads its properties into a new object, and then updates the specific property that corresponds to the name of the input field that triggered the event with its current value. This allows for dynamic handling of multiple form fields without needing separate state variables or handlers for each one.

  const handleSubmit = async (e) => {
    e.preventDefault() // when the create listing button is clicked, this stops the browser from reloading the page (the default behavior for forms).
    setError(null)

    // We need to convert price and delivery_days to numbers, and split image_urls into an array before sending to the backend
    try {  // this block attempts to execute the code that creates the listing. If any error occurs during this process (like a network error or a server error), it will be caught by the catch block below, allowing us to handle it gracefully instead of crashing the application.
      const response = await fetch('http://localhost:5000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include',   // sends the session cookie with the request
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          delivery_days: Number(formData.delivery_days),
          image_url: formData.image_url.split(',').map(url => url.trim())
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message)
        return
      }

      setSuccess(true)

    } catch (err) {
      setError('Could not connect to server')
    }
  }

  if (success) {
    return <p>Listing created successfully!</p>
  }

  return (
    <form onSubmit={handleSubmit}> {/* 1. Wrap in form and move logic here */}
    <h1>Create a Listing</h1>
    {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
       <label>Title</label>
       <input name="title" value={formData.title} onChange={handleChange} />
      </div>

      <div>
        <label>Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} />
      </div>

      <div>
        <label>Price</label>
        <input name="price" type="number" value={formData.price} onChange={handleChange} />
      </div> 

      <div>
        <label>Delivery Days</label>
        <input name="delivery_days" type="number" value={formData.delivery_days} onChange={handleChange} />
      </div>

      <div>
        <label>Category ID</label>
        <input name="category_id" value={formData.category_id} onChange={handleChange} />
      </div>

      <div>
        <label>Image URLs (comma separated)</label>
        <input name="image_url" value={formData.image_url} onChange={handleChange} />
      </div>

      <button type="submit">Create Listing</button>
  </form>
  )
}