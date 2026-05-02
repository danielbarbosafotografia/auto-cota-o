export type VehicleType = 'carros' | 'motos' | 'caminhoes';

export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModel {
  codigo: string;
  nome: string;
}

export interface FipeYear {
  codigo: string;
  nome: string;
}

export interface FipeResult {
  Valor: string; // e.g. "R$ 15.000,00"
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  TipoVeiculo: number;
  SiglaCombustivel: string;
}

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1';

export const fetchBrands = async (type: VehicleType): Promise<FipeBrand[]> => {
  const response = await fetch(`${BASE_URL}/${type}/marcas`);
  if (!response.ok) throw new Error('Failed to fetch brands');
  return response.json();
};

export const fetchModels = async (type: VehicleType, brandCode: string): Promise<FipeModel[]> => {
  const response = await fetch(`${BASE_URL}/${type}/marcas/${brandCode}/modelos`);
  if (!response.ok) throw new Error('Failed to fetch models');
  const data = await response.json();
  return data.modelos; // Parallelum returns { modelos: [], anos: [] }
};

export const fetchYears = async (type: VehicleType, brandCode: string, modelCode: string): Promise<FipeYear[]> => {
  const response = await fetch(`${BASE_URL}/${type}/marcas/${brandCode}/modelos/${modelCode}/anos`);
  if (!response.ok) throw new Error('Failed to fetch years');
  return response.json();
};

export const fetchFipeValue = async (
  type: VehicleType, 
  brandCode: string, 
  modelCode: string, 
  yearCode: string
): Promise<FipeResult> => {
  const response = await fetch(`${BASE_URL}/${type}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`);
  if (!response.ok) throw new Error('Failed to fetch fipe value');
  return response.json();
};
