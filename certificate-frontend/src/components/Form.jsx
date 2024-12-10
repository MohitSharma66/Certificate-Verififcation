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

    const { instituteName, studentName, year, semester, studentUniqueId, instituteId, CGPA } = formData;

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

    try {
      console.log({
        studentUniqueId: formData.studentUniqueId,
        studentName: formData.studentName,
        course: formData.course,
        instituteName: formData.instituteName,
        instituteId: formData.instituteId,
        year: formData.year,
        semester: formData.semester,
        CGPA: formData.CGPA
      });
      
      // Call the issueCertificate function from blockchain
      await issueCertificate(
        parseInt(formData.studentUniqueId),    // uint256 _id
        formData.studentName,                  // string memory _studentName
        formData.course,                       // string memory _courseName
        formData.instituteName,                // string memory _institution
        parseInt(formData.instituteId),        // uint256 _instituteId
        parseInt(formData.year),               // uint256 _year
        parseInt(formData.semester),           // uint256 _semester
        formData.CGPA                          // string memory _CGPA
      );         

      setSuccessMessage('Certificate information submitted successfully!');

      // Reset form after successful submission
      setFormData({
        instituteName: '',
        instituteId: '',
        studentName: '',
        year: '',
        semester: '',
        studentUniqueId: '',
        course: '',
        CGPA: ''
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
