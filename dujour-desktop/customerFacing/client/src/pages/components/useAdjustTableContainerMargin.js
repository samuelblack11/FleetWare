import { useLayoutEffect, useEffect } from 'react';

const useAdjustTableContainerMargin = (dependency) => {
    const adjustTableContainerMargin = () => {
        const cartSidebar = document.querySelector('.cart-sidebar');
        if (!cartSidebar) return;
    
        const tableContainer = cartSidebar.querySelector('.table-container');
        if (!tableContainer) return;
    
        // Reset margin top first to get a fresh measurement
        tableContainer.style.marginTop = '0px';
    
        // Now calculate the required margin
        const buildCartSection = document.querySelector('.build-cart-section');
        const cardContainer = document.querySelector('.card-container');
        const cartHeader = cartSidebar.querySelector('h2');
    
        if (buildCartSection && cardContainer && cartHeader) {
            const buildCartSectionTop = buildCartSection.getBoundingClientRect().top;
            const cardContainerTop = cardContainer.getBoundingClientRect().top;
            const cartHeaderHeight = cartHeader.offsetHeight;
    
            const marginTopDifference = cardContainerTop - buildCartSectionTop - cartHeaderHeight;
            tableContainer.style.marginTop = `${marginTopDifference}px`;
        }
    };

    // Attach the event listener for resize on window
    useLayoutEffect(() => {
        window.addEventListener('resize', adjustTableContainerMargin);
    
        return () => {
            // Clean up the event listener when the component unmounts
            window.removeEventListener('resize', adjustTableContainerMargin);
        };
    }, [dependency]); // Re-run the effect when dependency changes
    
    // Trigger the adjustment when dependency changes, or component mounts initially
    useEffect(() => {
        adjustTableContainerMargin();
    }, [dependency]);  // Dependency on cartItems to re-run when it changes
};

export default useAdjustTableContainerMargin;
