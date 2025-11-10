'use client';

import type { ChangeEvent }     from 'react';
import type { Advocate }        from '@DB/schema';

import { useEffect, useState }  from 'react';
import { filterAdvocates }      from '@Utils/filterAdvocates';

function Home() {
  const [advocates, setAdvocates]                 = useState<Advocate[]>([]);
  const [filteredAdvocates, setFilteredAdvocates] = useState<Advocate[]>([]);
  const [searchTerm, setSearchTerm]               = useState<string>('');

  useEffect(() => {
    console.log('fetching advocates...');
    fetch('/api/advocates').then((response) => {
      response.json().then((jsonResponse: { data: Advocate[] }) => {
        setAdvocates(jsonResponse.data);
        setFilteredAdvocates(jsonResponse.data);
      });
    });
  }, []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextSearchTerm = e.target.value;
    setSearchTerm(nextSearchTerm);

    const nextFiltered = filterAdvocates(advocates, nextSearchTerm);
    setFilteredAdvocates(nextFiltered);
  };

  const handleResetClick = () => {
    console.log('resetting search...');
    setSearchTerm('');
    setFilteredAdvocates(advocates);
  };

  return (
    <main style={{ margin: '24px' }}>
      <h1>Solace Advocates</h1>
      <br />
      <br />
      <div>
        <p>Search</p>
        <p>
          Searching for: <span>{searchTerm}</span>
        </p>
        <input style={{ border: '1px solid black' }} value={searchTerm} onChange={handleSearchChange} />
        <button onClick={handleResetClick}>Reset Search</button>
      </div>
      <br />
      <br />
      <table>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>City</th>
            <th>Degree</th>
            <th>Specialties</th>
            <th>Years of Experience</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {filteredAdvocates.map((advocate) => {
            return (
              <tr key={advocate.id}>
                <td>{advocate.firstName}</td>
                <td>{advocate.lastName}</td>
                <td>{advocate.city}</td>
                <td>{advocate.degree}</td>
                <td>
                  {advocate.specialties.map((s) => (
                    <div key={s}>{s}</div>
                  ))}
                </td>
                <td>{advocate.yearsOfExperience}</td>
                <td>{advocate.phoneNumber}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}


export default Home;
