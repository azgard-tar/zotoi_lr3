import TableCell from "@mui/material/TableCell";
import type { TriangularNumber } from "../types";

/**
 * Компонент для форматованого відображення 3-компонентного числа
 */
export const TriangularNumberCell: React.FC<{
  t: TriangularNumber;
  precision?: number;
}> = ({ t, precision = 4 }) => (
  <TableCell sx={{ whiteSpace: "nowrap" }} align="center">
    [{t.l.toFixed(precision)}, {t.m.toFixed(precision)},{" "}
    {t.u.toFixed(precision)}]
  </TableCell>
);