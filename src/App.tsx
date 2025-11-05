import React, { useState, useMemo, useEffect } from "react";
import {
  ThemeProvider,
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
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  T_ZERO,
  triAdd,
  triSubtract,
  triMultiply,
  triMultiplyByScalar,
  triDivideByScalar,
  triMax,
  triMin,
  defuzzify,
  transpose,
  create2DArray,
  create3DArray,
  resizeLabels,
  resize2DArray,
  resize3DArray,
} from "./utils";
import type {
  TriangularNumber,
  CalculationResults,
} from "./types";
import { ALTERNATIVE_MAP, ALTERNATIVE_TERMS, CRITERIA_MAP, CRITERIA_TERMS } from "./constants";
import { theme } from "./theme";
import { CustomTabPanel } from "./components/CustomTabPanel";
import { TriangularNumberCell } from "./components/TriangularNumberCell";


function App() {
  const [page, setPage] = useState<"setup" | "results">("setup");
  const [resultPage, setResultPage] = useState(0);

  const [numAlternatives, setNumAlternatives] = useState(5);
  const [numCriteria, setNumCriteria] = useState(4);
  const [numExperts, setNumExperts] = useState(3);
  const [v, setV] = useState(0.5);

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

  const [benefitCost, setBenefitCost] = useState(() =>
    Array(numCriteria).fill(true)
  );
  useEffect(() => {
    setBenefitCost([false, true, true, false]);
  }, []);

  const [criteriaInputs, setCriteriaInputs] = useState(() =>
    transpose([
      ["VL", "H", "L"],
      ["VL", "M", "L"],
      ["L", "VH", "M"],
      ["VH", "VL", "VH"],
    ])
  );

  const [alternativeInputs, setAlternativeInputs] = useState(() =>
    (
      [
        [
          ["F", "P", "VG", "F", "E"],
          ["P", "E", "VP", "E", "G"],
          ["VG", "F", "VP", "VP", "G"],
          ["P", "VG", "F", "E", "VG"],
        ],
        [
          ["E", "VP", "VP", "VP", "E"],
          ["VG", "VP", "E", "VG", "E"],
          ["VG", "VP", "E", "G", "VG"],
          ["P", "VP", "VP", "VG", "E"],
        ],
        [
          ["E", "F", "F", "F", "E"],
          ["VG", "E", "F", "VG", "E"],
          ["VP", "VP", "E", "F", "E"],
          ["F", "VP", "G", "F", "VP"],
        ],
      ] as string[][][]
    ).map((expertMatrix) => transpose(expertMatrix))
  );

  const [results, setResults] = useState<CalculationResults | null>(null);

  useEffect(() => {
    setAlternativeLabels((prev) =>
      resizeLabels(prev, numAlternatives, "Альтернатива")
    );
    setAlternativeInputs((prev) =>
      resize3DArray(prev, numExperts, numAlternatives, numCriteria, "F")
    );
  }, [numAlternatives, numExperts, numCriteria]);

  useEffect(() => {
    setCriteriaLabels((prev) => resizeLabels(prev, numCriteria, "Критерій"));
    setBenefitCost((prev) => {
      const newBC = Array(numCriteria).fill(true);
      prev.slice(0, numCriteria).forEach((val, i) => (newBC[i] = val));
      return newBC;
    });
    setCriteriaInputs((prev) =>
      resize2DArray(prev, numExperts, numCriteria, "M")
    );
    setAlternativeInputs((prev) =>
      resize3DArray(prev, numExperts, numAlternatives, numCriteria, "F")
    );
  }, [numCriteria, numExperts, numAlternatives]);

  useEffect(() => {
    setExpertLabels((prev) => resizeLabels(prev, numExperts, "Експерт"));
    setCriteriaInputs((prev) =>
      resize2DArray(prev, numExperts, numCriteria, "M")
    );
    setAlternativeInputs((prev) =>
      resize3DArray(prev, numExperts, numAlternatives, numCriteria, "F")
    );
  }, [numExperts, numAlternatives, numCriteria]);

  const handleBenefitCostChange = (critIndex: number) => {
    setBenefitCost((prev) =>
      prev.map((val, i) => (i === critIndex ? !val : val))
    );
  };

  const resetInputs = () => {
    setCriteriaInputs(create2DArray(numExperts, numCriteria, "M"));
    setAlternativeInputs(
      create3DArray(numExperts, numAlternatives, numCriteria, "F")
    );
    setBenefitCost(Array(numCriteria).fill(true));
    setV(0.5);
    setAlternativeLabels(resizeLabels([], numAlternatives, "Альтернатива"));
    setCriteriaLabels(resizeLabels([], numCriteria, "Критерій"));
    setExpertLabels(resizeLabels([], numExperts, "Експерт"));
  };

  const handleCountChange =
    (setter: React.Dispatch<React.SetStateAction<number>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const strValue = e.target.value;
      if (strValue === "") {
        setter(1);
        return;
      }
      const value = parseInt(strValue, 10);
      if (!isNaN(value) && value > 0 && value <= 20) {
        setter(value);
      }
    };

  // const handleVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const strValue = e.target.value;
  //   if (strValue === "") {
  //     setV(0);
  //     return;
  //   }
  //   const value = parseFloat(strValue);
  //   if (!isNaN(value) && value >= 0 && value <= 1) {
  //     setV(value);
  //   }
  // };

  const handleLabelChange =
    (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) =>
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


  const calculate = () => {
    try {
      const criteriaTri: TriangularNumber[][] = criteriaInputs.map(
        (expertRow) => expertRow.map((term) => CRITERIA_MAP.get(term) || T_ZERO)
      );
      const alternativeTri: TriangularNumber[][][] = alternativeInputs.map(
        (expertMatrix) =>
          expertMatrix.map((altRow) =>
            altRow.map((term) => ALTERNATIVE_MAP.get(term) || T_ZERO)
          )
      );

      const step2_criteria: TriangularNumber[] = [];
      for (let j = 0; j < numCriteria; j++) {
        const ls = criteriaTri.map((expert) => expert[j].l);
        const ms = criteriaTri.map((expert) => expert[j].m);
        const us = criteriaTri.map((expert) => expert[j].u);
        step2_criteria.push({
          l: Math.min(...ls),
          m: ms.reduce((a, b) => a + b, 0) / numExperts,
          u: Math.max(...us),
        });
      }

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
            m: ms.reduce((a, b) => a + b, 0) / numExperts,
            u: Math.max(...us),
          };
        }
      }

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
          step3_fStar.push(f_max);
          step3_fNadir.push(f_min);
        } else {
          step3_fStar.push(f_min);
          step3_fNadir.push(f_max);
        }
      }

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
            numerator = triSubtract(f_j_star, f_ij);
            denominator = f_j_star.u - f_j_nadir.l;
          } else {
            numerator = triSubtract(f_ij, f_j_star);
            denominator = f_j_nadir.u - f_j_star.l;
          }

          step4_normalizedDiff[i][j] = triDivideByScalar(
            numerator,
            denominator
          );
        }
      }

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
        const R_i = weightedDiffs.reduce(triMax, weightedDiffs[0] || T_ZERO);

        step5_S.push(S_i);
        step5_R.push(R_i);
      }

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

      const step7_S_defuzz = step5_S.map(defuzzify);
      const step7_R_defuzz = step5_R.map(defuzzify);
      const step7_Q_defuzz = step6_Q.map(defuzzify);

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
    }
  };

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
          {/*
          <Grid item xs={6} md={2.5}>
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
            />
          </Grid>
          */}
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
    [numAlternatives, numCriteria, numExperts, v, calculate]
  );

  const criteriaInputTable = useMemo(
    () => (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Важливість критеріїв
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: "250px",
                    position: "relative",
                    overflow: "hidden",
                    padding: 0,
                    borderRight: "1px solid rgba(224, 224, 224, 1)",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: "6px",
                      left: "16px",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                    }}
                  >
                    Експерт
                  </Box>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "6px",
                      right: "16px",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                    }}
                  >
                    Критерій
                  </Box>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "150%",
                      height: "1px",
                      backgroundColor: "rgba(224, 224, 224, 1)",
                      transform: "translate(-50%, -50%) rotate(-25deg)",
                      transformOrigin: "center center",
                    }}
                  />
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
              <TableRow>
                <TableCell>
                  Тип критерію
                  <Tooltip title="Відмітьте, якщо критерій є 'вигодою' (бажано більше). Залиште пустим, якщо це 'витрата' (бажано менше).">
                    <InfoOutlinedIcon
                      color="action"
                      sx={{
                        ml: 0.5,
                        fontSize: "1rem",
                        verticalAlign: "middle",
                      }}
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
                        {CRITERIA_TERMS.map((term) => (
                          <MenuItem key={term.shortName} value={term.shortName}>
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
    ]
  );

  const alternativeInputTables = useMemo(
    () => (
      <>
        {expertLabels.map((expertLabel, eIdx) => (
          <Paper key={eIdx} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Оцінки експерта: {expertLabel}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        width: "250px",
                        position: "relative",
                        overflow: "hidden",
                        padding: 0,
                        borderRight: "1px solid rgba(224, 224, 224, 1)",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: "6px",
                          left: "16px",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                        }}
                      >
                        Альтернатива
                      </Box>
                      <Box
                        sx={{
                          position: "absolute",
                          top: "6px",
                          right: "16px",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                        }}
                      >
                        Критерій
                      </Box>
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          width: "150%",
                          height: "1px",
                          backgroundColor: "rgba(224, 224, 224, 1)",
                          transform: "translate(-50%, -50%) rotate(-25deg)",
                          transformOrigin: "center center",
                        }}
                      />
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
                            {ALTERNATIVE_TERMS.map((term) => (
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
    ]
  );

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
                    disabled={resultPage === 7}
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
                      <TableCell align="center">
                        R (Нечіткий максимум)
                      </TableCell>
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

            <CustomTabPanel value={resultPage} index={4}>
              <Typography variant="h6" gutterBottom>
                {`Нечіткий показник Q (v=${v})`}
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Альтернатива</TableCell>
                      <TableCell align="center">
                        Q (Нечіткий компроміс)
                      </TableCell>
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

            <CustomTabPanel value={resultPage} index={6}>
              <Typography variant="h6" gutterBottom>
                Ранжування за S, R, Q (в порядку зростання)
              </Typography>
              <Grid container spacing={2}>
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
    </ThemeProvider>
  );
}

export default App;
