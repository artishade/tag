// Global type declarations for libraries that may lack bundled types

// file-saver type declaration
declare module "file-saver" {
  export function saveAs(blob: Blob | string, filename?: string): void;
  export function saveAs(
    ...args: [Blob | string, string]
  ): void;
  export default {
    saveAs,
  };
}

// react-dropzone type declaration (fallback if bundled types aren't resolved)
declare module "react-dropzone" {
  import type { ReactNode } from "react";

  export interface FileRejection {
    file: File & { path?: string };
    errors: {
      code: string;
      message: string;
      file: File & { path?: string };
    }[];
  }

  export interface Accept<T> {
    [key: string]: T;
  }

  export interface DropEvent {
    [key: string]: any;
  }

  export interface DropzoneOptions {
    accept?: Record<string, string[]>;
    multiple?: boolean;
    maxFiles?: number;
    onDrop?: (
      acceptedFiles: File[],
      fileRejections: FileRejection[],
      event: DropEvent
    ) => void;
    onDropAccepted?: (
      acceptedFiles: File[],
      event: DropEvent
    ) => void;
    onDropRejected?: (
      fileRejections: FileRejection[],
      event: DropEvent
    ) => void;
  }

  export interface DropzoneState {
    getRootProps: (props?: Record<string, any>) => Record<string, any>;
    getInputProps: (props?: Record<string, any>) => Record<string, any>;
    isDragActive: boolean;
    isDragActiveChildren: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFocused: boolean;
    isFileDialogActive: boolean;
    fileRejections: FileRejection[];
  }

  export function useDropzone(
    props?: DropzoneOptions
  ): DropzoneState;

  export const FileTypes: { [key: string]: string[] };

  export type FileRejectionType = FileRejection;
}
