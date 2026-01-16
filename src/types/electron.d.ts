export interface ElectronAPI {
  getProjects(): Promise<any[]>
  saveProject(project: any, useSWOTFormat?: boolean): Promise<boolean>
  loadProject(projectId: string): Promise<any | null>
  deleteProject(projectId: string): Promise<boolean>
  openProjectFile(): Promise<any | null>
  saveProjectAs(project: any): Promise<boolean>
  saveExportedFile(blob: Blob, defaultFileName: string, filters: { name: string; extensions: string[] }[]): Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    // События меню будут приходить через CustomEvent
  }
}
