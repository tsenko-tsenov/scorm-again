import { describe, it, expect } from 'vitest';
import Scorm2004API from '../../src/Scorm2004API';
import Scorm12API from '../../src/Scorm12API';

describe('Type Safety Verification', () => {
  it('should ensure getCMIValue returns string as per interface contract', () => {
    const scorm2004 = new Scorm2004API();
    const scorm12 = new Scorm12API();
    
    scorm2004.lmsInitialize();
    scorm12.lmsInitialize();

    // This test verifies the TypeScript compilation and runtime behavior
    // getCMIValue should return string according to IBaseAPI interface
    const value1: string = scorm2004.getCMIValue("cmi.learner_id");
    const value2: string = scorm12.getCMIValue("cmi.core.student_id");

    // Verify they are actually strings
    expect(typeof value1).toBe('string');
    expect(typeof value2).toBe('string');
    
    // Verify the values are reasonable (should be empty string for unset values)
    expect(value1).toBe('');
    expect(value2).toBe('');
  });

  it('should convert various types to strings correctly', () => {
    const scorm2004 = new Scorm2004API();
    scorm2004.lmsInitialize();
    
    // Test that undefined values are converted to empty strings
    const emptyResult: string = scorm2004.getCMIValue("cmi.location");
    expect(typeof emptyResult).toBe('string');
    expect(emptyResult).toBe(''); // Should be empty string for unset values
    
    // Test that setting a value and getting it back returns a string
    scorm2004.lmsSetValue("cmi.location", "bookmark_1");
    const setResult: string = scorm2004.getCMIValue("cmi.location");
    expect(typeof setResult).toBe('string');
    expect(setResult).toBe('bookmark_1');
  });
});