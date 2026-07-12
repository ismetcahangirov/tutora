export interface CategoryView {
  id: string;
  name: string;
  slug: string;
}

export interface SubjectView {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
}

export interface DistrictView {
  id: string;
  name: string;
  slug: string;
}

export interface LanguageView {
  id: string;
  name: string;
  code: string;
}
