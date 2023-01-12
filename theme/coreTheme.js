export const colors = {
  blue: "#2D7DDB",
  red: "#ed4337",
  orange: "#ffb347",
  lightBlack: "rgba(0, 0, 0, 0.87)"
};

const coreTheme = {
  shape: {
    borderRadius: "12px"
  },
  
  typography: {
    fontFamily: [  
      "Righteous",
      "Arista",
      "Inter",
      "Arial",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(","),
    h1: {
      // Portfolio balance numbers
      fontFamily: 'Arista',
      fontSize: "32px",
      fontWeight: 800,
      lineHeight: 1.167,
      ["@media (max-width:576px)"]: {
        // eslint-disable-line no-useless-computed-key
        fontSize: "1.6rem"
      }
    },
    h2: {
      // Navigation tabs / section headers
      fontSize: "16px",
      fontWeight: 700,
      lineHeight: 1.5,
      ["@media (max-width:576px)"]: {
        // eslint-disable-line no-useless-computed-key
        fontSize: "1rem"
      }
    },
    h3: {
      // yearn title text YEARN
      fontFamily: [
        "Arista"
      ],
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.167,
      ["@media (max-width:576px)"]: {
        // eslint-disable-line no-useless-computed-key
        fontSize: "1.2rem"
      }
    },
    h4: {
      // yearn title text finance
      fontSize: "1.5rem",
      letterSpacing: "0.3rem",
      fontWeight: 300,
      lineHeight: 1.167,
      ["@media (max-width:576px)"]: {
        // eslint-disable-line no-useless-computed-key
        fontSize: "1.2rem"
      }
    },
    h5: {
      // card headers
      fontSize: "0.9rem",
      fontWeight: 700,
      lineHeight: 1.167,
      ["@media (max-width:576px)"]: {
        // eslint-disable-line no-useless-computed-key
        fontSize: "0.7rem"
      }
    },
    h6: {
      // card headers
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.167,
      ["@media (max-width:576px)"]: {
        // eslint-disable-line no-useless-computed-key
        fontSize: "1.2rem"
      }
    },
    subtitle1: {
      fontSize: "0.9rem",
      fontWeight: 300,
      lineHeight: 1.167,
      ["@media (max-width:576px)"]: {
        // eslint-disable-line no-useless-computed-key
        fontSize: "0.7rem"
      }
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 300,
      lineHeight: 1.167,
      ["@media (max-width:576px)"]: {
        // eslint-disable-line no-useless-computed-key
        fontSize: "0.8rem"
      }
    }
  },
  palette: {
    primary: {
      main: "#FFBD59"
    },
    secondary: {
      main: "#FFFFFF"
    },
    error: {
      main: "#dc3545"
    }
  },
  overrides: {
    MuiPaper: {
      root: {
        backgroundColor: "#131b4c"
      }
    },
    MuiButton: {
      root: {
        minWidth: "50px",
        "&:hover": {
          backgroundColor: '"#131b4c',
        },
        
      },
      outlinedSizeSmall: {
        fontSize: "0.7rem",
        padding: "6px 9px",
        ["@media (max-width:576px)"]: {
          // eslint-disable-line no-useless-computed-key
          padding: "3px 0px"
        }
      },
      sizeLarge: {
        padding: "19px 24px",
        minWidth: "150px"
      },
      textSizeLarge: {
        fontSize: "2.4rem",
        ["@media (max-width:576px)"]: {
          // eslint-disable-line no-useless-computed-key
          fontSize: "2rem"
        }
      }
    },
    MuiDialog: {      
      paperWidthSm: {
        maxWidth: "800px",
      }
    },
    MuiToggleButton: {
      root: {
        border: "none",
        borderRadius: "12px",
      },
      "&$selected": {
        border: '1px solid #06d3d7',
        backgroundColor: 'rgba(0,0,0,0)'
      }
    },
    MuiSnackbar: {
      root: {
        maxWidth: "calc(100vw - 24px)"
      },
      anchorOriginBottomLeft: {
        bottom: "12px",
        left: "12px",
        "@media (min-width: 960px)": {
          bottom: "50px",
          left: "80px"
        }
      }
    },
    MuiAccordion: {
      root: {
        margin: "0px",
        "&:before": {
          //underline color when textfield is inactive
          backgroundColor: "none",
          height: "0px"
        },
        "&$expanded": {
          margin: "0px"
        }
      }
    },
    MuiAccordionSummary: {
      root: {
        padding: "0px 24px",
        "@media (max-width:576px)": {
          padding: "0px 6px"
        }
      },
      content: {
        margin: "0px !important"
      }
    },
    MuiAccordionDetails: {
      root: {
        padding: "0"
      }
    },
    MuiTableCell: {
      head: {
        padding: "26px 24px"
      },
      body: {
        padding: "12px 24px",
        borderBottom: "none"
      }
    },
    MuiInput: {
      underline: {
        '&:before': { //underline color when textfield is inactive
          borderBottom: 'none !important'
        },
        '&:hover:not($disabled):before': { //underline color when hovered
          borderBottom: 'none !important'
        },
      }
    },
    Mui: {
      '&$disabled': {
        '&:before': {
          borderBottom: 'none'
        }
      }
    }
  }
};

export default coreTheme;
