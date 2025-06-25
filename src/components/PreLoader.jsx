import React from "react";
import ReactLoading from "react-loading";

function PreLoader({ children, isLoading = false, loadingText = "Loading", subText = "Please wait..." }) {
  return (
    <>
      {isLoading ? (
        <div style={{
          position: 'absolute',
          top: '45px', // Start below header
          left: '0px',
          right: '0px',
          bottom: '36px', // End above footer
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000000',
          zIndex: 9999
        }}>
          <ReactLoading
            type={"bars"}
            color={"#ffffff"}
            height={100}
            width={100}
          />
          <div style={{
            marginTop: '30px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              color: '#ffffff', 
              marginBottom: '10px',
              fontSize: '24px',
              fontWeight: '300'
            }}>
              {loadingText}
            </h2>
            <p style={{ 
              color: '#cccccc',
              fontSize: '14px',
              fontWeight: '300'
            }}>
              {subText}
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
}

export default PreLoader;