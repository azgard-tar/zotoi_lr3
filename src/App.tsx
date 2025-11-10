/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Paper,
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Tabs,
  Tab,
  AppBar,
  IconButton,
  Checkbox,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  FormHelperText,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

// --- Типи даних ---

/**
 * Трикутне нечітке число (l, m, u)
 */
type TriangularNumber = {
  l: number; // lower
  m: number; // middle
  u: number; // upper
};

/**
 * Лінгвістичний терм (для дропдавнів)
 */
type LinguisticTerm = {
  id: string; // Додано для стабільного рендерингу
  name: string;
  shortName: string;
  tri: TriangularNumber;
};

/**
 * Структура для зберігання результатів ранжування
 */
type RankedAlternative = {
  altIndex: number;
  altLabel: string;
  s: number;
  r: number;
  q: number;
};

/**
 * Структура для збереження всіх результатів VIKOR
 */
type CalculationResults = {
  step2_criteria: TriangularNumber[];
  step2_alternatives: TriangularNumber[][];
  step3_fStar: TriangularNumber[];
  step3_fNadir: TriangularNumber[];
  step4_normalizedDiff: TriangularNumber[][];
  step5_S: TriangularNumber[];
  step5_R: TriangularNumber[];
  step6_Q: TriangularNumber[];
  step7_S_defuzz: number[];
  step7_R_defuzz: number[];
  step7_Q_defuzz: number[];
  step8_rankedS: RankedAlternative[];
  step8_rankedR: RankedAlternative[];
  step8_rankedQ: RankedAlternative[];
  step9_Adv: number;
  step9_DQ: number;
  step9_C1_met: boolean;
  step9_C2_met: boolean;
  step9_compromiseSet: string[];
};

// --- Константи (з Таблиць 1, 2 у документі) ---
// ПЕРЕТВОРЕНО НА ПОЧАТКОВИЙ СТАН

const INITIAL_CRITERIA_TERMS: LinguisticTerm[] = [
  { id: "c1", name: "Very Low (VL)", shortName: "VL", tri: { l: 0.0, m: 0.1, u: 0.3 } },
  { id: "c2", name: "Low (L)", shortName: "L", tri: { l: 0.1, m: 0.3, u: 0.5 } },
  { id: "c3", name: "Medium (M)", shortName: "M", tri: { l: 0.3, m: 0.5, u: 0.7 } },
  { id: "c4", name: "High (H)", shortName: "H", tri: { l: 0.5, m: 0.7, u: 0.9 } },
  { id: "c5", name: "Very High (VH)", shortName: "VH", tri: { l: 0.7, m: 0.9, u: 1.0 } },
];

const INITIAL_ALTERNATIVE_TERMS: LinguisticTerm[] = [
  { id: "a1", name: "Very Poor (VP)", shortName: "VP", tri: { l: 0.0, m: 0.0, u: 0.2 } },
  { id: "a2", name: "Poor (P)", shortName: "P", tri: { l: 0.0, m: 0.2, u: 0.4 } },
  { id: "a3", name: "Fair (F)", shortName: "F", tri: { l: 0.2, m: 0.4, u: 0.6 } },
  { id: "a4", name: "Good (G)", shortName: "G", tri: { l: 0.4, m: 0.6, u: 0.8 } },
  { id: "a5", name: "Very Good (VG)", shortName: "VG", tri: { l: 0.6, m: 0.8, u: 1.0 } },
  { id: "a6", name: "Excellent (E)", shortName: "E", tri: { l: 0.8, m: 0.9, u: 1.0 } },
];

// Тема MUI (залишаємо як було)
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f4f6f8",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#f1f3f4",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
        },
      },
    },
  },
});

// --- Допоміжні функції Fuzzy ---

const T_ZERO: TriangularNumber = { l: 0, m: 0, u: 0 };

/**
 * Додавання: (a,b,c) + (d,e,f) = (a+d, b+e, c+f)
 */
const triAdd = (
  t1: TriangularNumber,
  t2: TriangularNumber
): TriangularNumber => ({
  l: t1.l + t2.l,
  m: t1.m + t2.m,
  u: t1.u + t2.u,
});

/**
 * Віднімання: (a,b,c) - (d,e,f) = (a-f, b-e, c-d)
 */
const triSubtract = (
  t1: TriangularNumber,
  t2: TriangularNumber
): TriangularNumber => ({
  l: t1.l - t2.u,
  m: t1.m - t2.m,
  u: t1.u - t2.l,
});

/**
 * Множення: (a,b,c) * (d,e,f) = (a*d, b*e, c*f)
 */
const triMultiply = (
  t1: TriangularNumber,
  t2: TriangularNumber
): TriangularNumber => ({
  l: t1.l * t2.l,
  m: t1.m * t2.m,
  u: t1.u * t2.u,
});

/**
 * Множення на скаляр: (a,b,c) * k = (a*k, b*k, c*k)
 */
const triMultiplyByScalar = (
  t: TriangularNumber,
  s: number
): TriangularNumber => ({
  l: t.l * s,
  m: t.m * s,
  u: t.u * s,
});

/**
 * Ділення на скаляр: (a,b,c) / k = (a/k, b/k, c/k)
 */
const triDivideByScalar = (
  t: TriangularNumber,
  s: number
): TriangularNumber => {
  if (s === 0) {
    // console.warn("Fuzzy division by zero. Returning zero.");
    return T_ZERO;
  }
  return {
    l: t.l / s,
    m: t.m / s,
    u: t.u / s,
  };
};

/**
 * Компонентний максимум: MAX((a,b,c), (d,e,f)) = (max(a,d), max(b,e), max(c,f))
 */
const triMax = (
  t1: TriangularNumber,
  t2: TriangularNumber
): TriangularNumber => ({
  l: Math.max(t1.l, t2.l),
  m: Math.max(t1.m, t2.m),
  u: Math.max(t1.u, t2.u),
});

/**
 * Компонентний мінімум: MIN((a,b,c), (d,e,f)) = (min(a,d), min(b,e), min(c,f))
 */
const triMin = (
  t1: TriangularNumber,
  t2: TriangularNumber
): TriangularNumber => ({
  l: Math.min(t1.l, t2.l),
  m: Math.min(t1.m, t2.m),
  u: Math.min(t1.u, t2.u),
});

/**
 * Крок 7: Дефазифікація за формулою (l + 2m + u) / 4
 */
const defuzzify = (t: TriangularNumber): number => {
  return (t.l + 2 * t.m + t.u) / 4;
};

/**
 * Транспонування матриці (rows -> cols)
 */
const transpose = (matrix: any[][]): any[][] => {
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    return [];
  }
  return matrix[0].map((_, c) => matrix.map((r) => r[c]));
};

// --- Допоміжні функції ---

/**
 * Ініціалізація 2D-масиву
 */
function create2DArray<T>(rows: number, cols: number, fill: T): T[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

/**
 * Ініціалізація 3D-масиву
 */
function create3DArray<T>(
  d1: number,
  d2: number,
  d3: number,
  fill: T
): T[][][] {
  return Array.from({ length: d1 }, () => create2DArray(d2, d3, fill));
}

/**
 * "Розумна" функція для зміни розміру масиву назв
 */
const resizeLabels = (
  prevLabels: string[],
  newCount: number,
  prefix: string
): string[] => {
  const newLabels = Array.from({ length: newCount }, (_, i) =>
    prevLabels[i] !== undefined ? prevLabels[i] : `${prefix} ${i + 1}`
  );
  return newLabels;
};

/**
 * "Розумна" функція для зміни розміру 2D-масиву
 */
const resize2DArray = <T,>(
  prevArray: T[][],
  newRows: number,
  newCols: number,
  fill: T
): T[][] => {
  const newArray = create2DArray(newRows, newCols, fill);
  const rowsToCopy = Math.min(newRows, prevArray.length);
  const colsToCopy = Math.min(newCols, prevArray[0]?.length || 0);
  for (let r = 0; r < rowsToCopy; r++) {
    for (let c = 0; c < colsToCopy; c++) {
      newArray[r][c] = prevArray[r][c];
    }
  }
  return newArray;
};

/**
 * "Розумна" функція для зміни розміру 3D-масиву
 */
const resize3DArray = <T,>(
  prevArray: T[][][],
  d1: number,
  d2: number,
  d3: number,
  fill: T
): T[][][] => {
  const newArray = create3DArray(d1, d2, d3, fill);
  const d1ToCopy = Math.min(d1, prevArray.length);
  const d2ToCopy = Math.min(d2, prevArray[0]?.length || 0);
  const d3ToCopy = Math.min(d3, prevArray[0]?.[0]?.length || 0);
  for (let i = 0; i < d1ToCopy; i++) {
    for (let j = 0; j < d2ToCopy; j++) {
      for (let k = 0; k < d3ToCopy; k++) {
        newArray[i][j][k] = prevArray[i][j][k];
      }
    }
  }
  return newArray;
};

/**
 * Компонент для вкладки з результатами
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Компонент для форматованого відображення 3-компонентного числа
 */
const TriangularNumberCell: React.FC<{
  t: TriangularNumber;
  precision?: number;
}> = ({ t, precision = 4 }) => (
  <TableCell sx={{ whiteSpace: "nowrap" }} align="center">
    [{t.l.toFixed(precision)}, {t.m.toFixed(precision)}, {t.u.toFixed(precision)}
    ]
  </TableCell>
);

// --- Компонент Редактора Термів ---

type TermErrors = {
  name?: string;
  shortName?: string;
  l?: string;
  m?: string;
  u?: string;
};

interface LinguisticTermEditorProps {
  open: boolean;
  onClose: () => void;
  initialTerms: LinguisticTerm[];
  onSave: (terms: LinguisticTerm[]) => void;
  title: string;
}

const LinguisticTermEditor: React.FC<LinguisticTermEditorProps> = ({
  open,
  onClose,
  initialTerms,
  onSave,
  title,
}) => {
  const [terms, setTerms] = useState(() =>
    JSON.parse(JSON.stringify(initialTerms))
  );
  const [errors, setErrors] = useState<Record<string, TermErrors>>({});

  // Скидання стану при відкритті
  useEffect(() => {
    if (open) {
      setTerms(JSON.parse(JSON.stringify(initialTerms)));
      setErrors({});
    }
  }, [open, initialTerms]);

  const validateTerms = (currentTerms: LinguisticTerm[]): boolean => {
    const newErrors: Record<string, TermErrors> = {};
    let isValid = true;
    
    if (currentTerms.length < 2) {
      // Глобальна помилка, але ми покажемо її на кнопці
      isValid = false;
      // Можна додати глобальний стан помилки, якщо потрібно
    }

    const shortNames = new Set<string>();

    currentTerms.forEach((term) => {
      const termErrors: TermErrors = {};
      const { l, m, u } = term.tri;

      if (!term.name) {
        termErrors.name = "Обов'язково";
        isValid = false;
      }
      if (!term.shortName) {
        termErrors.shortName = "Обов'язково";
        isValid = false;
      } else if (shortNames.has(term.shortName)) {
        termErrors.shortName = "Дублікат";
        isValid = false;
      }
      shortNames.add(term.shortName);

      if (l > m) {
        termErrors.l = "l <= m";
        isValid = false;
      }
      if (m > u) {
        termErrors.m = "m <= u";
        isValid = false;
      }
      if (l === u) {
        termErrors.l = "l != u";
        termErrors.u = "l != u";
        isValid = false;
      }

      if (Object.keys(termErrors).length > 0) {
        newErrors[term.id] = termErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = () => {
    if (!validateTerms(terms)) {
      return;
    }

    // Нормалізація
    const maxU = Math.max(...terms.map((t: LinguisticTerm) => t.tri.u));
    let normalizedTerms = terms;

    if (maxU > 1) {
      normalizedTerms = terms.map((t: LinguisticTerm) => ({
        ...t,
        tri: {
          l: t.tri.l / maxU,
          m: t.tri.m / maxU,
          u: t.tri.u / maxU,
        },
      }));
    }

    onSave(normalizedTerms);
    onClose();
  };

  const handleTermChange = (id: string, field: string, value: string) => {
    setTerms((prev: LinguisticTerm[]) =>
      prev.map((term) =>
        term.id === id ? { ...term, [field]: value } : term
      )
    );
  };

  const handleTriChange = (id: string, field: 'l' | 'm' | 'u', value: string) => {
    const numValue = parseFloat(value);
    setTerms((prev: LinguisticTerm[]) =>
      prev.map((term) =>
        term.id === id
          ? {
              ...term,
              tri: { ...term.tri, [field]: isNaN(numValue) ? 0 : numValue },
            }
          : term
      )
    );
  };

  const addTerm = () => {
    setTerms((prev: LinguisticTerm[]) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "New Term",
        shortName: "NT",
        tri: { l: 0, m: 0, u: 0 },
      },
    ]);
  };

  const deleteTerm = (id: string) => {
    setTerms((prev: LinguisticTerm[]) => prev.filter((term) => term.id !== id));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Назва</TableCell>
                  <TableCell>Коротка назва</TableCell>
                  <TableCell align="center">L (min)</TableCell>
                  <TableCell align="center">M (avg)</TableCell>
                  <TableCell align="center">U (max)</TableCell>
                  <TableCell align="center">Дія</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {terms.map((term: LinguisticTerm) => (
                  <TableRow key={term.id}>
                    <TableCell>
                      <TextField
                        value={term.name}
                        onChange={(e) =>
                          handleTermChange(term.id, "name", e.target.value)
                        }
                        size="small"
                        error={!!errors[term.id]?.name}
                        helperText={errors[term.id]?.name}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={term.shortName}
                        onChange={(e) =>
                          handleTermChange(term.id, "shortName", e.target.value)
                        }
                        size="small"
                        sx={{ width: '100px' }}
                        error={!!errors[term.id]?.shortName}
                        helperText={errors[term.id]?.shortName}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={term.tri.l}
                        onChange={(e) =>
                          handleTriChange(term.id, "l", e.target.value)
                        }
                        size="small"
                        type="number"
                        sx={{ width: '100px' }}
                        error={!!errors[term.id]?.l}
                        helperText={errors[term.id]?.l}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={term.tri.m}
                        onChange={(e) =>
                          handleTriChange(term.id, "m", e.target.value)
                        }
                        size="small"
                        type="number"
                        sx={{ width: '100px' }}
                        error={!!errors[term.id]?.m}
                        helperText={errors[term.id]?.m}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={term.tri.u}
                        onChange={(e) =>
                          handleTriChange(term.id, "u", e.target.value)
                        }
                        size="small"
                        type="number"
                        sx={{ width: '100px' }}
                        error={!!errors[term.id]?.u}
                        helperText={errors[term.id]?.u}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => deleteTerm(term.id)}
                        disabled={terms.length <= 2}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button startIcon={<AddIcon />} onClick={addTerm}>
            Додати терм
          </Button>
          {terms.length < 2 && (
            <FormHelperText error sx={{ textAlign: 'center', fontSize: '1rem' }}>
              Необхідно мінімум 2 терми
            </FormHelperText>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button onClick={handleSave} variant="contained" disabled={terms.length < 2}>
          Зберегти
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- Головний компонент App ---

function App() {
  // --- Стани ---
  const [page, setPage] = useState<"setup" | "results">("setup");
  const [resultPage, setResultPage] = useState(0);

  // Налаштування
  const [numAlternatives, setNumAlternatives] = useState(5); // з прикладу
  const [numCriteria, setNumCriteria] = useState(4); // з прикладу
  const [numExperts, setNumExperts] = useState(3); // з прикладу
  const [v, setV] = useState(0.5); // Вага стратегії "max group utility"

  // НОВІ СТАНИ для термів
  const [criteriaTerms, setCriteriaTerms] = useState(INITIAL_CRITERIA_TERMS);
  const [alternativeTerms, setAlternativeTerms] = useState(
    INITIAL_ALTERNATIVE_TERMS
  );
  const [modalOpen, setModalOpen] = useState<"criteria" | "alternative" | null>(
    null
  );

  // Словники для швидкого пошуку (ТЕПЕР В useMemo)
  const CRITERIA_MAP = useMemo(
    () => new Map(criteriaTerms.map((t) => [t.shortName, t.tri])),
    [criteriaTerms]
  );
  const ALTERNATIVE_MAP = useMemo(
    () => new Map(alternativeTerms.map((t) => [t.shortName, t.tri])),
    [alternativeTerms]
  );

  // Назви
  const [alternativeLabels, setAlternativeLabels] = useState(() =>
    resizeLabels(
      ["A1", "A2", "A3", "A4", "A5"],
      numAlternatives,
      "Альтернатива"
    )
  );
  const [criteriaLabels, setCriteriaLabels] = useState(() =>
    resizeLabels(["C1", "C2", "C3", "C4"], numCriteria, "Критерій")
  );
  const [expertLabels, setExpertLabels] = useState(() =>
    resizeLabels(["D1", "D2", "D3"], numExperts, "Експерт")
  );

  // Тип критеріїв (true = Benefit, false = Cost) (з Рис. 1)
  const [benefitCost, setBenefitCost] = useState(() =>
    Array(numCriteria).fill(true)
  );
  // Встановлюємо з Рис. 1: C1(false), C2(true), C3(true), C4(false)
  useEffect(() => {
    setBenefitCost([false, true, true, false]);
  }, []);

  // Вхідні дані
  const [criteriaInputs, setCriteriaInputs] = useState(() =>
    // З Рис. 1
    transpose([
      ["VL", "H", "L"],
      ["VL", "M", "L"],
      ["L", "VH", "M"],
      ["VH", "VL", "VH"],
    ])
  );
  // Допоміжна функція для "транспонування" (для зручності вводу)
  // (ВИДАЛЕНО Array.prototype.transpose, оскільки це викликало помилку часу ініціалізації)

  const [alternativeInputs, setAlternativeInputs] = useState(() =>
    // З Рис. 2
    ([
      [
        // D1
        ["F", "P", "VG", "F", "E"],
        ["P", "E", "VP", "E", "G"],
        ["VG", "F", "VP", "VP", "G"],
        ["P", "VG", "F", "E", "VG"],
      ],
      [
        // D2
        ["E", "VP", "VP", "VP", "E"],
        ["VG", "VP", "E", "VG", "E"],
        ["VG", "VP", "E", "G", "VG"],
        ["P", "VP", "VP", "VG", "E"],
      ],
      [
        // D3
        ["E", "F", "F", "F", "E"],
        ["VG", "E", "F", "VG", "E"],
        ["VP", "VP", "E", "F", "E"],
        ["F", "VP", "G", "F", "VP"],
      ],
      // Транспонуємо кожну матрицю, щоб було [alt][crit]
    ] as string[][][]).map((expertMatrix) => transpose(expertMatrix))
  );

  // Результати
  const [results, setResults] = useState<CalculationResults | null>(null);

  // --- Ефекти для "розумної" зміни розміру ---

  useEffect(() => {
    setAlternativeLabels((prev) =>
      resizeLabels(prev, numAlternatives, "Альтернатива")
    );
    setAlternativeInputs((prev) =>
      resize3DArray(
        prev,
        numExperts,
        numAlternatives,
        numCriteria,
        alternativeTerms[0]?.shortName || "F"
      )
    );
  }, [numAlternatives, numExperts, numCriteria, alternativeTerms]); // Додано alternativeTerms

  useEffect(() => {
    setCriteriaLabels((prev) =>
      resizeLabels(prev, numCriteria, "Критерій")
    );
    setBenefitCost((prev) => {
      const newBC = Array(numCriteria).fill(true);
      prev.slice(0, numCriteria).forEach((val, i) => (newBC[i] = val));
      return newBC;
    });
    setCriteriaInputs((prev) =>
      resize2DArray(
        prev,
        numExperts,
        numCriteria,
        criteriaTerms[0]?.shortName || "M"
      )
    );
    setAlternativeInputs((prev) =>
      resize3DArray(
        prev,
        numExperts,
        numAlternatives,
        numCriteria,
        alternativeTerms[0]?.shortName || "F"
      )
    );
  }, [numCriteria, numExperts, numAlternatives, criteriaTerms, alternativeTerms]); // Додано terms

  useEffect(() => {
    setExpertLabels((prev) => resizeLabels(prev, numExperts, "Експерт"));
    setCriteriaInputs((prev) =>
      resize2DArray(
        prev,
        numExperts,
        numCriteria,
        criteriaTerms[0]?.shortName || "M"
      )
    );
    setAlternativeInputs((prev) =>
      resize3DArray(
        prev,
        numExperts,
        numAlternatives,
        numCriteria,
        alternativeTerms[0]?.shortName || "F"
      )
    );
  }, [numExperts, numAlternatives, numCriteria, criteriaTerms, alternativeTerms]); // Додано terms

  // --- Обробники ---

  const handleBenefitCostChange = (critIndex: number) => {
    setBenefitCost((prev) =>
      prev.map((val, i) => (i === critIndex ? !val : val))
    );
  };

  /**
   * Скидання вхідних матриць та назв
   */
  const resetInputs = () => {
    setCriteriaInputs(
      create2DArray(
        numExperts,
        numCriteria,
        criteriaTerms[0]?.shortName || ""
      )
    );
    setAlternativeInputs(
      create3DArray(
        numExperts,
        numAlternatives,
        numCriteria,
        alternativeTerms[0]?.shortName || ""
      )
    );
    setBenefitCost(Array(numCriteria).fill(true));
    setV(0.5);
    setAlternativeLabels(resizeLabels([], numAlternatives, "Альтернатива"));
    setCriteriaLabels(resizeLabels([], numCriteria, "Критерій"));
    setExpertLabels(resizeLabels([], numExperts, "Експерт"));
  };

  /**
   * Оновлення кількості
   */
  const handleCountChange =
    (setter: React.Dispatch<React.SetStateAction<number>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const strValue = e.target.value;
      if (strValue === "") {
        setter(1); // Повертаємо до min, якщо поле очищене
        return;
      }
      const value = parseInt(strValue, 10);
      if (!isNaN(value) && value > 0 && value <= 20) {
        setter(value);
      }
    };

  /**
   * Оновлення `v`
   */
  const handleVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const strValue = e.target.value;
    if (strValue === "") {
      setV(0);
      return;
    }
    const value = parseFloat(strValue);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setV(value);
    }
  };

/**
 * Оновлення назв
 */
  const handleLabelChange =
    (
      setter: React.Dispatch<React.SetStateAction<string[]>>,
      index: number
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter((prev) =>
        prev.map((label, i) => (i === index ? e.target.value : label))
      );
    };

  const handleCriteriaChange = (
    expertIndex: number,
    criteriaIndex: number,
    value: string
  ) => {
    setCriteriaInputs((prev) => {
      const newInputs = prev.map((row) => [...row]);
      newInputs[expertIndex][criteriaIndex] = value;
      return newInputs;
    });
  };

  const handleAlternativeChange = (
    expertIndex: number,
    altIndex: number,
    criteriaIndex: number,
    value: string
  ) => {
    setAlternativeInputs((prev) => {
      const newInputs = prev.map((expertMatrix) =>
        expertMatrix.map((altRow) => [...altRow])
      );
      newInputs[expertIndex][altIndex][criteriaIndex] = value;
      return newInputs;
    });
  };

  // -----------------------------------------------------------------
  // ГОЛОВНА ФУНКЦІЯ: Виконує всі обчислення Fuzzy VIKOR
  // -----------------------------------------------------------------
  const calculate = () => {
    try {
      // --- Крок 1: Вхідні дані (перетворення в трикутні) ---
      const criteriaTri: TriangularNumber[][] = criteriaInputs.map(
        (expertRow) =>
          expertRow.map((term) => CRITERIA_MAP.get(term) || T_ZERO)
      );
      const alternativeTri: TriangularNumber[][][] = alternativeInputs.map(
        (expertMatrix) =>
          expertMatrix.map((altRow) =>
            altRow.map((term) => ALTERNATIVE_MAP.get(term) || T_ZERO)
          )
        );

      // --- Крок 2: Агрегація (min, avg, max) ---
      // Агреговані ваги критеріїв
      const step2_criteria: TriangularNumber[] = [];
      for (let j = 0; j < numCriteria; j++) {
        const ls = criteriaTri.map((expert) => expert[j].l);
        const ms = criteriaTri.map((expert) => expert[j].m);
        const us = criteriaTri.map((expert) => expert[j].u);
        step2_criteria.push({
          l: Math.min(...ls),
          m: ms.reduce((a, b) => a + b, 0) / numExperts, // Arithmetic mean
          u: Math.max(...us),
        });
      }

      // Агреговані оцінки альтернатив
      const step2_alternatives: TriangularNumber[][] = create2DArray(
        numAlternatives,
        numCriteria,
        T_ZERO
      );
      for (let i = 0; i < numAlternatives; i++) {
        for (let j = 0; j < numCriteria; j++) {
          const ls = alternativeTri.map((expert) => expert[i][j].l);
          const ms = alternativeTri.map((expert) => expert[i][j].m);
          const us = alternativeTri.map((expert) => expert[i][j].u);
          step2_alternatives[i][j] = {
            l: Math.min(...ls),
            m: ms.reduce((a, b) => a + b, 0) / numExperts, // Arithmetic mean
            u: Math.max(...us),
          };
        }
      }

      // --- Крок 3: Визначення ідеальних (f*) та найгірших (f°) значень ---
      const step3_fStar: TriangularNumber[] = [];
      const step3_fNadir: TriangularNumber[] = [];

      for (let j = 0; j < numCriteria; j++) {
        const all_f_for_j = step2_alternatives.map((altRow) => altRow[j]);
        const f_min = all_f_for_j.reduce(triMin, {
          l: Infinity,
          m: Infinity,
          u: Infinity,
        });
        const f_max = all_f_for_j.reduce(triMax, {
          l: -Infinity,
          m: -Infinity,
          u: -Infinity,
        });

        if (benefitCost[j]) {
          // Benefit criterion (max)
          step3_fStar.push(f_max);
          step3_fNadir.push(f_min);
        } else {
          // Cost criterion (min)
          step3_fStar.push(f_min);
          step3_fNadir.push(f_max);
        }
      }

      // --- Крок 4: Обчислення нормованої нечіткої різниці (d_ij) ---
      const step4_normalizedDiff: TriangularNumber[][] = create2DArray(
        numAlternatives,
        numCriteria,
        T_ZERO
      );

      for (let i = 0; i < numAlternatives; i++) {
        for (let j = 0; j < numCriteria; j++) {
          const f_ij = step2_alternatives[i][j];
          const f_j_star = step3_fStar[j];
          const f_j_nadir = step3_fNadir[j];

          let numerator: TriangularNumber;
          let denominator: number;

          if (benefitCost[j]) {
            // (f* - f_ij) / (u* - l°)
            numerator = triSubtract(f_j_star, f_ij);
            denominator = f_j_star.u - f_j_nadir.l;
          } else {
            // (f_ij - f*) / (u° - l*)
            numerator = triSubtract(f_ij, f_j_star);
            denominator = f_j_nadir.u - f_j_star.l;
          }

          step4_normalizedDiff[i][j] = triDivideByScalar(numerator, denominator);
        }
      }

      // --- Крок 5: Обчислення S_i та R_i ---
      const step5_S: TriangularNumber[] = [];
      const step5_R: TriangularNumber[] = [];

      for (let i = 0; i < numAlternatives; i++) {
        const weightedDiffs: TriangularNumber[] = [];
        for (let j = 0; j < numCriteria; j++) {
          const w_j = step2_criteria[j];
          const d_ij = step4_normalizedDiff[i][j];
          weightedDiffs.push(triMultiply(w_j, d_ij));
        }

        const S_i = weightedDiffs.reduce(triAdd, T_ZERO);
        const R_i = weightedDiffs.reduce(
          triMax,
          weightedDiffs[0] || T_ZERO
        );

        step5_S.push(S_i);
        step5_R.push(R_i);
      }

      // --- Крок 6: Обчислення Q_i ---
      const S_star_tri = step5_S.reduce(triMin, {
        l: Infinity,
        m: Infinity,
        u: Infinity,
      });
      const R_star_tri = step5_R.reduce(triMin, {
        l: Infinity,
        m: Infinity,
        u: Infinity,
      });

      const S_nadir_u = Math.max(...step5_S.map((t) => t.u));
      const S_star_l = Math.min(...step5_S.map((t) => t.l));

      const R_nadir_u = Math.max(...step5_R.map((t) => t.u));
      const R_star_l = Math.min(...step5_R.map((t) => t.l));

      const step6_Q: TriangularNumber[] = [];

      for (let i = 0; i < numAlternatives; i++) {
        const S_i = step5_S[i];
        const R_i = step5_R[i];

        const term1_num = triSubtract(S_i, S_star_tri);
        const term1_den = S_nadir_u - S_star_l;
        const term1 = triMultiplyByScalar(
          triDivideByScalar(term1_num, term1_den),
          v
        );

        const term2_num = triSubtract(R_i, R_star_tri);
        const term2_den = R_nadir_u - R_star_l;
        const term2 = triMultiplyByScalar(
          triDivideByScalar(term2_num, term2_den),
          1 - v
        );

        step6_Q.push(triAdd(term1, term2));
      }

      // --- Крок 7: Дефазифікація ---
      const step7_S_defuzz = step5_S.map(defuzzify);
      const step7_R_defuzz = step5_R.map(defuzzify);
      const step7_Q_defuzz = step6_Q.map(defuzzify);

      // --- Крок 8: Ранжування (в порядку ЗРОСТАННЯ) ---
      const rankedData = alternativeLabels.map((label, i) => ({
        altIndex: i,
        altLabel: label,
        s: step7_S_defuzz[i],
        r: step7_R_defuzz[i],
        q: step7_Q_defuzz[i],
      }));

      const step8_rankedS = [...rankedData].sort((a, b) => a.s - b.s);
      const step8_rankedR = [...rankedData].sort((a, b) => a.r - b.r);
      const step8_rankedQ = [...rankedData].sort((a, b) => a.q - b.q);

      // --- Крок 9: Перевірка умов та компромісне рішення ---
      const A1 = step8_rankedQ[0];
      const A2 = step8_rankedQ[1];
      const m = numAlternatives;
      const step9_DQ = 1 / (m - 1);
      const step9_Adv = A2 ? A2.q - A1.q : 0;

      const step9_C1_met = step9_Adv >= step9_DQ;
      const step9_C2_met =
        step8_rankedS[0].altIndex === A1.altIndex ||
        step8_rankedR[0].altIndex === A1.altIndex;

      let step9_compromiseSet: string[] = [];
      if (step9_C1_met && step9_C2_met) {
        step9_compromiseSet = [A1.altLabel];
      } else if (step9_C1_met && !step9_C2_met) {
        step9_compromiseSet = [A1.altLabel, A2.altLabel];
      } else if (!step9_C1_met) {
        step9_compromiseSet = step8_rankedQ
          .filter((alt) => alt.q - A1.q < step9_DQ)
          .map((alt) => alt.altLabel);
      }

      // Збереження результатів
      const finalResults: CalculationResults = {
        step2_criteria,
        step2_alternatives,
        step3_fStar,
        step3_fNadir,
        step4_normalizedDiff,
        step5_S,
        step5_R,
        step6_Q,
        step7_S_defuzz,
        step7_R_defuzz,
        step7_Q_defuzz,
        step8_rankedS,
        step8_rankedR,
        step8_rankedQ,
        step9_Adv,
        step9_DQ,
        step9_C1_met,
        step9_C2_met,
        step9_compromiseSet,
      };

      setResults(finalResults);
      setResultPage(0);
      setPage("results");
    } catch (error) {
      console.error("Calculation failed:", error);
      // Тут можна встановити стан помилки та показати користувачу
    }
  };

  // --- Мемоїзовані компоненти UI ---

  const settingsPanel = useMemo(
    () => (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Налаштування
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid sx={{ display: "flex", flexGrow: 1 }}>
            <TextField
              label="Кількість альтернатив"
              type="number"
              value={numAlternatives}
              onChange={handleCountChange(setNumAlternatives)}
              fullWidth
              InputProps={{ inputProps: { min: 1, max: 20 } }}
              sx={{ flexGrow: 1 }}
            />
          </Grid>
          <Grid sx={{ display: "flex", flexGrow: 1 }}>
            <TextField
              label="Кількість критеріїв"
              type="number"
              value={numCriteria}
              onChange={handleCountChange(setNumCriteria)}
              fullWidth
              InputProps={{ inputProps: { min: 1, max: 20 } }}
              sx={{ flexGrow: 1 }}
            />
          </Grid>
          <Grid sx={{ display: "flex", flexGrow: 1 }}>
            <TextField
              label="Кількість експертів"
              type="number"
              value={numExperts}
              onChange={handleCountChange(setNumExperts)}
              fullWidth
              InputProps={{ inputProps: { min: 1, max: 20 } }}
              sx={{ flexGrow: 1 }}
            />
          </Grid>
          <Grid sx={{ display: "flex", flexGrow: 1 }}>
            <TextField
              label="Вага стратегії (v)"
              type="number"
              value={v}
              onChange={handleVChange}
              fullWidth
              InputProps={{
                inputProps: { min: 0, max: 1, step: 0.1 },
                endAdornment: (
                  <Tooltip title="Вага 'максимальної групової корисності'. Зазвичай 0.5.">
                    <InfoOutlinedIcon color="action" />
                  </Tooltip>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
          </Grid>
          
          <Grid>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                height: "56px",
                alignItems: "center",
              }}
            >
              <Button
                variant="outlined"
                onClick={resetInputs}
                sx={{ flexGrow: 1 }}
              >
                Скинути
              </Button>
              <Button
                variant="contained"
                onClick={calculate}
                sx={{ flexGrow: 1 }}
              >
                Розрахувати
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    ),
    [numAlternatives, numCriteria, numExperts, v, calculate] // Додано v
  );

  const criteriaInputTable = useMemo(
    () => (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Важливість критеріїв
          </Typography>
          <Button startIcon={<EditIcon />} onClick={() => setModalOpen('criteria')} size="small">
            Редагувати терми
          </Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: "250px", position: 'relative', overflow: 'hidden', padding: 0, borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
                  <Box sx={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '16px',
                    fontWeight: 700,
                    fontSize: '0.875rem'
                  }}>
                    Експерт
                  </Box>
                  <Box sx={{
                    position: 'absolute',
                    top: '6px',
                    right: '16px',
                    fontWeight: 700,
                    fontSize: '0.875rem'
                  }}>
                    Критерій
                  </Box>
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '150%',
                    height: '1px',
                    backgroundColor: 'rgba(224, 224, 224, 1)',
                    transform: 'translate(-50%, -50%) rotate(-25deg)',
                    transformOrigin: 'center center'
                  }} />
                </TableCell>
                {criteriaLabels.map((label, cIdx) => (
                  <TableCell key={cIdx} align="center">
                    <TextField
                      value={label}
                      onChange={handleLabelChange(setCriteriaLabels, cIdx)}
                      size="small"
                      sx={{
                        minWidth: 100,
                        "& .MuiInputBase-input": {
                          fontWeight: 700,
                          textAlign: "center",
                        },
                      }}
                    />
                  </TableCell>
                ))}
              </TableRow>
              {/* НОВИЙ РЯДОК: Benefit/Cost */}
              <TableRow>
                <TableCell>
                  Тип критерію
                  <Tooltip title="Відмітьте, якщо критерій є 'вигодою' (бажано більше). Залиште пустим, якщо це 'витрата' (бажано менше).">
                    <InfoOutlinedIcon
                      color="action"
                      sx={{ ml: 0.5, fontSize: "1rem", verticalAlign: "middle" }}
                    />
                  </Tooltip>
                </TableCell>
                {criteriaLabels.map((_, cIdx) => (
                  <TableCell key={cIdx} align="center">
                    <Checkbox
                      checked={benefitCost[cIdx]}
                      onChange={() => handleBenefitCostChange(cIdx)}
                    />
                    Benefit
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {expertLabels.map((label, eIdx) => (
                <TableRow key={eIdx}>
                  <TableCell sx={{ width: "250px" }}>
                    <TextField
                      value={label}
                      onChange={handleLabelChange(setExpertLabels, eIdx)}
                      size="small"
                    />
                  </TableCell>
                  {criteriaLabels.map((_, cIdx) => (
                    <TableCell key={cIdx} align="center">
                      <Select
                        value={criteriaInputs[eIdx]?.[cIdx] || "M"}
                        onChange={(e) =>
                          handleCriteriaChange(eIdx, cIdx, e.target.value)
                        }
                        variant="standard"
                        fullWidth
                        renderValue={(value) => value}
                      >
                        {criteriaTerms.map((term) => (
                          <MenuItem
                            key={term.shortName}
                            value={term.shortName}
                          >
                            {term.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    ),
    [
      numCriteria,
      numExperts,
      criteriaInputs,
      criteriaLabels,
      expertLabels,
      benefitCost,
      criteriaTerms, // Додано
    ]
  );

  const alternativeInputTables = useMemo(
    () => (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ m: 0 }}>
              Оцінки експертів
          </Typography>
          <Button startIcon={<EditIcon />} onClick={() => setModalOpen('alternative')} size="small">
            Редагувати терми
          </Button>
        </Box>
        {expertLabels.map((expertLabel, eIdx) => (
          <Paper key={eIdx} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Оцінки експерта: {expertLabel}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "250px", position: 'relative', overflow: 'hidden', padding: 0, borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
                      <Box sx={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '16px',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}>
                        Альтернатива
                      </Box>
                      <Box sx={{
                        position: 'absolute',
                        top: '6px',
                        right: '16px',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}>
                        Критерій
                      </Box>
                      <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '150%',
                        height: '1px',
                        backgroundColor: 'rgba(224, 224, 224, 1)',
                        transform: 'translate(-50%, -50%) rotate(-25deg)',
                        transformOrigin: 'center center'
                      }} />
                    </TableCell>
                    {criteriaLabels.map((label, cIdx) => (
                      <TableCell
                        key={cIdx}
                        align="center"
                        sx={{ minWidth: 100 }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alternativeLabels.map((label, aIdx) => (
                    <TableRow key={aIdx}>
                      <TableCell sx={{ width: "250px" }}>
                        <TextField
                          value={label}
                          onChange={handleLabelChange(
                            setAlternativeLabels,
                            aIdx
                          )}
                          size="small"
                        />
                      </TableCell>
                      {criteriaLabels.map((_, cIdx) => (
                        <TableCell key={cIdx} align="center">
                          <Select
                            value={
                              alternativeInputs[eIdx]?.[aIdx]?.[cIdx] || "F"
                            }
                            onChange={(e) =>
                              handleAlternativeChange(
                                eIdx,
                                aIdx,
                                cIdx,
                                e.target.value
                              )
                            }
                            variant="standard"
                            fullWidth
                            renderValue={(value) => value}
                          >
                            {alternativeTerms.map((term) => (
                              <MenuItem
                                key={term.shortName}
                                value={term.shortName}
                              >
                                {term.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))}
      </>
    ),
    [
      numAlternatives,
      numCriteria,
      numExperts,
      alternativeInputs,
      alternativeLabels,
      expertLabels,
      criteriaLabels,
      alternativeTerms, // Додано
    ]
  );

  // --- Рендеринг ---

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {page === "setup" && (
          <>
            <Typography variant="h4" gutterBottom>
              Метод Fuzzy VIKOR (Налаштування)
            </Typography>
            {settingsPanel}
            {criteriaInputTable}
            {alternativeInputTables}
          </>
        )}

        {page === "results" && results && (
          <Paper sx={{ p: 0, overflow: "hidden" }}>
            <AppBar
              position="static"
              color="default"
              elevation={0}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 2,
                }}
              >
                <Button
                  color="primary"
                  onClick={() => setPage("setup")}
                  startIcon={<ArrowBackIosNewIcon />}
                >
                  Назад до налаштувань
                </Button>
                <Box>
                  <IconButton
                    onClick={() => setResultPage((p) => p - 1)}
                    disabled={resultPage === 0}
                  >
                    <ArrowBackIosNewIcon />
                  </IconButton>
                  <Typography
                    variant="button"
                    sx={{
                      display: "inline-block",
                      mx: 2,
                      minWidth: 100,
                      textAlign: "center",
                    }}
                  >
                    Крок {resultPage + 2}
                  </Typography>
                  <IconButton
                    onClick={() => setResultPage((p) => p + 1)}
                    disabled={resultPage === 7} // 8 вкладок, індекси 0-7
                  >
                    <ArrowForwardIosIcon />
                  </IconButton>
                </Box>
              </Box>
              <Tabs
                value={resultPage}
                onChange={(_, newValue) => setResultPage(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Крок 2: Агрегація" />
                <Tab label="Крок 3: Ідеал/Найгірше" />
                <Tab label="Крок 4: Норм. різниця" />
                <Tab label="Крок 5: S, R (Fuzzy)" />
                <Tab label="Крок 6: Q (Fuzzy)" />
                <Tab label="Крок 7: S, R, Q (Чіткі)" />
                <Tab label="Крок 8: Ранжування" />
                <Tab label="Крок 9: Результат" />
              </Tabs>
            </AppBar>

            {/* Крок 2: Агрегація */}
            <CustomTabPanel value={resultPage} index={0}>
              <Typography variant="h6" gutterBottom>
                Агреговані ваги критеріїв
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Критерій</TableCell>
                      <TableCell align="center">
                        Агрегована вага (l, m, u)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {criteriaLabels.map((label, cIdx) => (
                      <TableRow key={cIdx}>
                        <TableCell>{label}</TableCell>
                        <TriangularNumberCell
                          t={results.step2_criteria[cIdx]}
                        />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="h6" gutterBottom>
                Агреговані оцінки альтернатив
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Альтернатива</TableCell>
                      {criteriaLabels.map((label, cIdx) => (
                        <TableCell key={cIdx} align="center">
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alternativeLabels.map((label, aIdx) => (
                      <TableRow key={aIdx}>
                        <TableCell>{label}</TableCell>
                        {criteriaLabels.map((_, cIdx) => (
                          <TriangularNumberCell
                            key={cIdx}
                            t={results.step2_alternatives[aIdx][cIdx]}
                          />
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CustomTabPanel>

            {/* Крок 3: Ідеал / Найгірше */}
            <CustomTabPanel value={resultPage} index={1}>
              <Typography variant="h6" gutterBottom>
                Ідеальні (f*) та найгірші (f°) значення
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Критерій</TableCell>
                      <TableCell align="center">f* (Ідеал)</TableCell>
                      <TableCell align="center">f° (Найгірше)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {criteriaLabels.map((label, cIdx) => (
                      <TableRow key={cIdx}>
                        <TableCell>{label}</TableCell>
                        <TriangularNumberCell t={results.step3_fStar[cIdx]} />
                        <TriangularNumberCell t={results.step3_fNadir[cIdx]} />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CustomTabPanel>

            {/* Крок 4: Нормована різниця */}
            <CustomTabPanel value={resultPage} index={2}>
              <Typography variant="h6" gutterBottom>
                Нормована нечітка різниця d
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Альтернатива</TableCell>
                      {criteriaLabels.map((label, cIdx) => (
                        <TableCell key={cIdx} align="center">
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alternativeLabels.map((label, aIdx) => (
                      <TableRow key={aIdx}>
                        <TableCell>{label}</TableCell>
                        {criteriaLabels.map((_, cIdx) => (
                          <TriangularNumberCell
                            key={cIdx}
                            t={results.step4_normalizedDiff[aIdx][cIdx]}
                          />
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CustomTabPanel>

            {/* Крок 5: S, R (Fuzzy) */}
            <CustomTabPanel value={resultPage} index={3}>
              <Typography variant="h6" gutterBottom>
                Нечіткі S та R
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Альтернатива</TableCell>
                      <TableCell align="center">S (Нечітка сума)</TableCell>
                      <TableCell align="center">R (Нечіткий максимум)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alternativeLabels.map((label, aIdx) => (
                      <TableRow key={aIdx}>
                        <TableCell>{label}</TableCell>
                        <TriangularNumberCell t={results.step5_S[aIdx]} />
                        <TriangularNumberCell t={results.step5_R[aIdx]} />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CustomTabPanel>

            {/* Крок 6: Q (Fuzzy) */}
            <CustomTabPanel value={resultPage} index={4}>
              <Typography variant="h6" gutterBottom>
                {`Нечіткий показник Q (v=${v})`}
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Альтернатива</TableCell>
                      <TableCell align="center">Q (Нечіткий компроміс)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alternativeLabels.map((label, aIdx) => (
                      <TableRow key={aIdx}>
                        <TableCell>{label}</TableCell>
                        <TriangularNumberCell t={results.step6_Q[aIdx]} />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CustomTabPanel>

            {/* Крок 7: S, R, Q (Чіткі) */}
            <CustomTabPanel value={resultPage} index={5}>
              <Typography variant="h6" gutterBottom>
                Дефазифіковані значення S, R, Q
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Альтернатива</TableCell>
                      <TableCell align="center">S (Чітке)</TableCell>
                      <TableCell align="center">R (Чітке)</TableCell>
                      <TableCell align="center">Q (Чітке)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alternativeLabels.map((label, aIdx) => (
                      <TableRow key={aIdx}>
                        <TableCell>{label}</TableCell>
                        <TableCell align="center">
                          {results.step7_S_defuzz[aIdx].toFixed(4)}
                        </TableCell>
                        <TableCell align="center">
                          {results.step7_R_defuzz[aIdx].toFixed(4)}
                        </TableCell>
                        <TableCell align="center">
                          {results.step7_Q_defuzz[aIdx].toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CustomTabPanel>

            {/* Крок 8: Ранжування */}
            <CustomTabPanel value={resultPage} index={6}>
              <Typography variant="h6" gutterBottom>
                Ранжування за S, R, Q (в порядку зростання)
              </Typography>
              <Grid container spacing={2}>
                {/* Ранг S */}
                <Grid>
                  <Typography variant="subtitle1" align="center">
                    Ранжування за S
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ранг</TableCell>
                          <TableCell>Альтернатива</TableCell>
                          <TableCell>Значення S</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.step8_rankedS.map((alt, rIdx) => (
                          <TableRow key={alt.altIndex}>
                            <TableCell>{rIdx + 1}</TableCell>
                            <TableCell>{alt.altLabel}</TableCell>
                            <TableCell>{alt.s.toFixed(4)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                {/* Ранг R */}
                <Grid>
                  <Typography variant="subtitle1" align="center">
                    Ранжування за R
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ранг</TableCell>
                          <TableCell>Альтернатива</TableCell>
                          <TableCell>Значення R</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.step8_rankedR.map((alt, rIdx) => (
                          <TableRow key={alt.altIndex}>
                            <TableCell>{rIdx + 1}</TableCell>
                            <TableCell>{alt.altLabel}</TableCell>
                            <TableCell>{alt.r.toFixed(4)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                {/* Ранг Q */}
                <Grid>
                  <Typography variant="subtitle1" align="center">
                    Ранжування за Q (Головне)
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ранг</TableCell>
                          <TableCell>Альтернатива</TableCell>
                          <TableCell>Значення Q</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.step8_rankedQ.map((alt, rIdx) => (
                          <TableRow
                            key={alt.altIndex}
                            sx={{
                              backgroundColor:
                                rIdx === 0 ? "success.lighter" : "inherit",
                            }}
                          >
                            <TableCell>{rIdx + 1}</TableCell>
                            <TableCell>{alt.altLabel}</TableCell>
                            <TableCell>{alt.q.toFixed(4)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </CustomTabPanel>

            {/* Крок 9: Результат */}
            <CustomTabPanel value={resultPage} index={7}>
              <Typography variant="h6" gutterBottom>
                Компромісне рішення
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Typography>
                  Найкраща альтернатива (A(1)) за Q:{" "}
                  <strong>{results.step8_rankedQ[0].altLabel}</strong> (Q ={" "}
                  {results.step8_rankedQ[0].q.toFixed(6)})
                </Typography>
                <Typography>
                  Друга альтернатива (A(2)) за Q:{" "}
                  <strong>
                    {results.step8_rankedQ[1]
                      ? results.step8_rankedQ[1].altLabel
                      : "N/A"}
                  </strong>{" "}
                  (Q ={" "}
                  {results.step8_rankedQ[1]
                    ? results.step8_rankedQ[1].q.toFixed(6)
                    : "N/A"}
                  )
                </Typography>
                <Box sx={{ my: 2, borderTop: 1, borderColor: "divider" }} />
                <Typography>
                  Adv = Q(A(2)) - Q(A(1)) = {results.step9_Adv.toFixed(6)}
                </Typography>
                <Typography>
                  DQ = 1 / (m - 1) = 1 / ({numAlternatives} - 1) ={" "}
                  {results.step9_DQ.toFixed(6)}
                </Typography>
                <Typography
                  variant="h6"
                  color={results.step9_C1_met ? "success.main" : "error.main"}
                  sx={{ mt: 1 }}
                >
                  Умова 1 (Прийнятна перевага): Adv &ge; DQ?{" "}
                  <strong>
                    {results.step9_C1_met ? "ВИКОНУЄТЬСЯ" : "НЕ ВИКОНУЄТЬСЯ"}
                  </strong>
                </Typography>
                <Typography
                  variant="h6"
                  color={results.step9_C2_met ? "success.main" : "error.main"}
                  sx={{ mt: 1 }}
                >
                  Умова 2 (Прийнятна стабільність): A(1) найкраща за S або R?{" "}
                  <strong>
                    {results.step9_C2_met ? "ВИКОНУЄТЬСЯ" : "НЕ ВИКОНУЄТЬСЯ"}
                  </strong>
                  <br />
                  <Typography variant="body2" component="span">
                    (Найкраща за S: {results.step8_rankedS[0].altLabel};
                    Найкраща за R: {results.step8_rankedR[0].altLabel})
                  </Typography>
                </Typography>
                <Box sx={{ my: 2, borderTop: 1, borderColor: "divider" }} />
                <Typography variant="h5" color="primary.main">
                  Найкращі альтернативи:{" "}
                  {results.step9_compromiseSet.join(", ")}
                </Typography>
              </Paper>
            </CustomTabPanel>
          </Paper>
        )}
      </Container>
      
      {/* --- Модальне вікно --- */}
      <LinguisticTermEditor
        open={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        initialTerms={
          modalOpen === "criteria" ? criteriaTerms : alternativeTerms
        }
        onSave={
          modalOpen === "criteria" ? setCriteriaTerms : setAlternativeTerms
        }
        title={
          modalOpen === "criteria"
            ? "Редактор термів критеріїв"
            : "Редактор термів альтернатив"
        }
      />
    </ThemeProvider>
  );
}

export default App;