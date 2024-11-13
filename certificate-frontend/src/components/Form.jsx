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

    // Validate numeric fields
    const { year, semester, studentUniqueId, instituteId } = formData;
    if (!/^\d+$/.test(year) || !/^\d+$/.test(semester) || !/^\d+$/.test(studentUniqueId) || !/^\d+$/.test(instituteId)) {
      setError('Year, Semester, Institute ID, and Certificate Unique ID must be numerical.');
      return;
    }

    try {
      // Call the issueCertificate function from blockchain
      await issueCertificate(
        formData.studentUniqueId,
        formData.studentName,
        formData.course,
        formData.instituteName,
        `${formData.year}-${formData.semester}`
      );
      setSuccessMessage('Certificate information submitted successfully!');
      
      // Optionally, reset form after successful submission
      setFormData({
        instituteName: '',
        instituteId: '',
        studentName: '',
        year: '',
        semester: '',
        studentUniqueId: '',
        course: '',
      });
    } catch (err) {
      setError(`Failed to submit certificate information. Error: ${err.message || err}`);
      console.error(err);
    }
  };

  return (
    <div className="form-container">
      <h2>Certificate Issuance Form</h2>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}
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
          <label htmlFor="course">Course:</label>
          <input
            type="text"
            id="course"
            name="course"
            value={formData.course}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Submit Certificate Information</button>
      </form>
    </div>
  );
};

export default Form;
