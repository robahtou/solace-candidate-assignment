import type { Advocate } from '@DB/schema';
import styles from '@/app/styles.module.css';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

// Presentational table mapped to Advocate fields.
type Props = {
  advocates: Advocate[];
};

export function AdvocatesTable({ advocates }: Props) {
  return (
    <div className={styles['table-wrap']}>
      <Table className={styles['table']}>
        <TableCaption>Solace Advocates</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Degree</TableHead>
            <TableHead>Specialties</TableHead>
            <TableHead>Years of Experience</TableHead>
            <TableHead>Phone Number</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {advocates.map((advocate) => (
            <TableRow key={advocate.id}>
              <TableCell>{advocate.firstName}</TableCell>
              <TableCell>{advocate.lastName}</TableCell>
              <TableCell>{advocate.city}</TableCell>
              <TableCell>{advocate.degree}</TableCell>
              <TableCell>
                {advocate.specialties.map((s) => (
                  <div key={s}>{s}</div>
                ))}
              </TableCell>
              <TableCell>{advocate.yearsOfExperience}</TableCell>
              <TableCell>{advocate.phoneNumber}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
