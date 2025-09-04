import { useState } from 'react';
import { issueCertificate } from '../blockchain/certificate'; // Import from certificate.js
import './Form.css'; // Optional: For styling

const Form = () => {
  const [formData, setFormData] = useState({
    instituteName: '',
    instituteId: '',
    studentName: '',
    year: '',
    semester: '',
    studentUniqueId: '',
    course: '',
    CGPA: '',
    publicKey: '',
  }); 
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const { instituteName, studentName, year, semester, studentUniqueId, instituteId, CGPA, publicKey } = formData;

    // Validate fields
    if (!/^[a-zA-Z\s]+$/.test(instituteName)) {
      setError('Institute Name must only contain alphabets and spaces.');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(studentName)) {
      setError('Student Name must only contain alphabets and spaces.');
      return;
    }
    if (!/^\d+$/.test(year) || !/^\d+$/.test(semester) || !/^\d+$/.test(instituteId) || !/^\d+$/.test(studentUniqueId)) {
      setError('Year, Semester, Institute ID, and Certificate Unique ID must be numerical.');
      return;
    }
    if (!/^\d+(\.\d+)?$/.test(CGPA)) {
      setError('CGPA must be a valid decimal number.');
      return;
    }
    if (!publicKey.trim()) {
      setError('Public Key is required.');
      return;
    }

    try {
      // First, store certificate data in backend database
      const backendResponse = await fetch('https://24f056ce-d7b5-4356-a5bc-7facbffef6db-00-34fv3ndqep366.sisko.replit.dev:3001/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formData.studentUniqueId,
          studentName: formData.studentName,
          courseName: formData.course,
          institution: formData.instituteName,
          instituteId: parseInt(formData.instituteId),
          year: parseInt(formData.year),
          semester: parseInt(formData.semester),
          CGPA: formData.CGPA,
          publicKey: formData.publicKey
        })
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.error || 'Failed to store certificate data');
      }

      const backendData = await backendResponse.json();
      console.log('Certificate stored in database:', backendData);

      // Then store the hash on blockchain using the updated contract
      await issueCertificate(
        backendData.certificateHash,  // The hash from backend
        formData.instituteName        // Institute name
      );         

      setSuccessMessage(`Certificate issued successfully! Certificate Hash: ${backendData.certificateHash}`);

      // Reset form after successful submission
      setFormData({
        instituteName: '',
        instituteId: '',
        studentName: '',
        year: '',
        semester: '',
        studentUniqueId: '',
        course: '',
        CGPA: '',
        publicKey: ''
      });
    } catch (err) {
      setError(`Failed to submit certificate information. Error: ${err.message || err}`);
      console.error(err);
    }
  };

  return (
    <div className="form-container">
      <h2>Certificate Issuance Form</h2>
      {error && <h3 className="error">{error}</h3>}
      {successMessage && <h3 className="success">{successMessage}</h3>}
      <div className="two-parts">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="instituteName">Institute Name:</label>
          <input
            type="text"
            id="instituteName"
            name="instituteName"
            value={formData.instituteName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="instituteId">Institute ID:</label>
          <input
            type="number"
            id="instituteId"
            name="instituteId"
            value={formData.instituteId}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="studentName">Student Name:</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="year">Year:</label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="semester">Semester:</label>
          <input
            type="number"
            id="semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="studentUniqueId">Certificate Unique ID:</label>
          <input
            type="number"
            id="studentUniqueId"
            name="studentUniqueId"
            value={formData.studentUniqueId}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="course">Department:</label>
          <input
            type="text"
            id="course"
            name="course"
            value={formData.course}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="CGPA">CGPA:</label>
          <input
            type="text"
            id="CGPA"
            name="CGPA"
            value={formData.CGPA}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="publicKey">Institute Public Key:</label>
          <input
            type="text"
            id="publicKey"
            name="publicKey"
            value={formData.publicKey}
            onChange={handleChange}
            placeholder="Enter institute's public key for verification"
            required
          />
        </div>
        <button type="submit">Submit Certificate Information</button>
      </form>
      </div>
    </div>
  );
};

export default Form;
