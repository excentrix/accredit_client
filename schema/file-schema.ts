export type NaacFile = {
  academic_year: string;
  section: string;
  subsection: string;
  heading: string;
  structure: {
    [key: string]: {
      type: string;
    };
  };

  data: {
    [key: string]: string;
  };
};
