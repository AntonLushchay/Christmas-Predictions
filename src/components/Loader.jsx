import React from 'react';

export default function Loader({ isLoading }) {
    return (
        <div className={`loader-container ${!isLoading ? 'fade-out' : ''}`}>
            <div className="loader-content">
                <div className="snowglobe-loader">
                    <div className="globe-outline"></div>
                    <div className="snow-particle"></div>
                    <div className="snow-particle"></div>
                    <div className="snow-particle"></div>
                </div>
                <h2 className="loader-text">Загрузка магии...</h2>
            </div>
        </div>
    );
}
