import React from 'react';
import { connect } from 'react-redux';

import { Menu } from 'semantic-ui-react';

import { setCurrentChannel } from '../../actions';

import UserPanel from './UserPanel';
import Channels from './Channels';
import DirectMessages from './DirectMessages';

class SidePanel extends React.Component {
    render() {
        return (
            <Menu
                size="large"
                inverted
                fixed="left"
                vertical
                style={{ 
                    background: '#4c3c4c',
                    fontSize: '1.2rem'
                }}
            >
                <UserPanel user={this.props.user} />
                <Channels user={this.props.user} setCurrentChannel={this.props.setCurrentChannel} />
                <DirectMessages user={this.props.user} />
            </Menu>
        );
    }
}

const mapStateToProps = state => ({
    user: state.user.currentUser
});

export default connect(mapStateToProps, { setCurrentChannel })(SidePanel);